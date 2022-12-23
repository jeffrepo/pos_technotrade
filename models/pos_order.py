# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging
from datetime import timedelta
from functools import partial
from itertools import groupby
from collections import defaultdict

import psycopg2
import pytz
import re

from odoo import api, fields, models, tools, _
from odoo.tools import float_is_zero, float_round, float_repr, float_compare
from odoo.exceptions import ValidationError, UserError
from odoo.osv.expression import AND
import base64
import requests
from requests.auth import HTTPDigestAuth
import xmltodict, json

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = "pos.order"

    nozzle = fields.Integer('Nozzle')
    transaction = fields.Integer('Transaction technotrade')

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        logging.warning('UI ORDER')
        logging.warning(ui_order)
        logging.warning(res)
        if "transaction" in ui_order:
            logging.warning('TRANSACTION UI')
            logging.warning(ui_order['transaction'])
            res['transaction'] = ui_order['transaction'] or False
        if "nozzle" in ui_order:
            res['nozzle'] = ui_order['nozzle'] or False
        return res

    def technotrade_connection(self, data):
        url = "https://200.40.56.90/jsonPTS"
        headers = {
          'Content-Type': 'application/json',
          #'Authorization': 'Bearer '+str(refresh_token_config)
        }

        logging.warning('technotrade_connection')
        response = requests.post(url, data = data,auth=HTTPDigestAuth('admin', 'admin'), headers = headers,timeout=8.0 ,verify=False)
        logging.warning('response')
        logging.warning(response)
        response_connection = {}
        if response.status_code == 200:
            if response.content:
                logging.warning(response.content)
                response_content = response.content.decode('utf8')
                logging.warning(response_content)
                response_json = json.loads(response_content)
                if "Packets" in response_json and len(response_json["Packets"]) > 0:
                    for packet in response_json["Packets"]:
                        if "Error" in packet and packet["Error"] == True:
                            logging.warning(response_json)
                            logging.warning(response_json["Protocol"])
                            response_connection = [{'error_code': packet["Code"]}]
                        else:
                            response_connection = response_json["Packets"]
        else:
            response_connection = {'status_code': response.status_code}
        return response_connection


    def report_pump_transactions(self, table_id, date_start, date_end):
        logging.warning('ENTRA report_pump_transactions')
        # transactions = [{'product_id': 6,'name': '', 'Transaction': 1, 'Nozzle': 2 , 'Pump': 3, 'TotalAmount': 100, 'Date': '2022-10-27T17:12:1'}]
        transactions = []
        search_transactions = self.env['pos_technotrade.transaction'].search([('pos_order_line_id', '=', False)])

        logging.warning('TRANSACTION')
        logging.warning(search_transactions)
        for trans in search_transactions:
            transactions.append({
            'id':trans.id,
            'product_id':trans.product_id.id,
            'name':'',
            'transaction':trans.transaction,
            'nozzle':trans.nozzle,
            'pump':trans.pump,
            'total_amount':trans.amount,
            'total_volume':trans.total_volume,
            'fuel_grade_name':trans.fuel_grade_name,
            'date':trans.datetime_text,
            'volume':trans.volumne,
            'importe':trans.amount,
            'precio':trans.price
            })
        logging.warning('transactions')
        logging.warning(transactions)
        return transactions

    def update_product_grade_transaction(self):
        transactions_id = self.env['pos_technotrade.transaction'].search([('product_id','=', False),('fuel_grade_id','>', 0)])
        product_product = self.env['product.product'].search([('fuel_grade_id','>', 0)])
        new_dic_p = {}
        for pr in product_product:
            if pr.fuel_grade_id not in new_dic_p:
                new_dic_p[pr.fuel_grade_id] = pr


        if len(transactions_id) > 0:
            for p in transactions_id:
                p.update({'product_id': new_dic_p[p.fuel_grade_id].id})

        return True

    def get_fuel_grades_configuration(self):
        data =""" {
            "Protocol":"jsonPTS",
            "Packets": [{
                "Id": 1,
                "Type":"GetFuelGradesConfiguration"

            }]
        }"""

        response_technotrade = self.technotrade_connection(data)
        logging.warning("RESPONSE TECHNOTRASE get_fuel_grades_configuration")
        logging.warning(response_technotrade)
        if len(response_technotrade) > 0:
            if "Data" in response_technotrade[0] and len(response_technotrade[0]["Data"]) > 0:
                if "FuelGrades" in response_technotrade[0]["Data"] and len(response_technotrade[0]["Data"]["FuelGrades"]) > 0:
                    product_ids = self.env['product.template'].search([('fuel_grade_id','>', 0)])
                    product_dic = {}
                    if len(product_ids)>0:
                        for p in product_ids:
                            if p.nozzle not in product_dic:
                                product_dic[int(p.nozzle)] = p

                    for p in response_technotrade[0]["Data"]["FuelGrades"]:
                        if p["Id"] in product_dic:
                            product_dic[p["Id"]].update({'name':  p["Name"],'fuel_grade_id': p["Id"], 'detailed_type': 'product', 'available_in_pos': True, 'list_price': p["Price"]})
                        else:
                            pt = self.env['product.template'].create({'name':  p["Name"], 'fuel_grade_id': p["Id"], 'list_price': p["Price"], 'detailed_type': 'product', 'available_in_pos': True})
                            logging.warning(pt)
        return True

    def get_pump_nozzles_onfiguration(self):
        logging.warning('ENTRA get_pump_nozzles_onfiguration')
        self.get_fuel_grades_configuration()
        data =""" {
            "Protocol":"jsonPTS",
            "Packets": [{
                "Id": 1,
                "Type":"GetPumpNozzlesConfiguration"

            }]
        }"""
        response_technotrade = self.technotrade_connection(data)
        logging.warning("RESPONSE TECHNOTRASE get_pump_nozzles_onfiguration")
        logging.warning(response_technotrade)
        if len(response_technotrade) > 0:
            logging.warning(response_technotrade[0]["Data"])
            if "Data" in response_technotrade[0] and len(response_technotrade[0]["Data"]) > 0:
                if "PumpNozzles" in response_technotrade[0]["Data"] and len(response_technotrade[0]["Data"]["PumpNozzles"]) > 0:
                    pump_ids = self.env['technotrade.pump'].search([])
                    pump_dic = {}
                    if len(pump_ids)>0:
                        for p in pump_ids:
                            if p.name not in pump_dic:
                                pump_dic[int(p.name)] = p

                    for p in response_technotrade[0]["Data"]["PumpNozzles"]:
                        if p["PumpId"] in pump_dic:
                            pump_dic[p["PumpId"]].update({'name': p["PumpId"]})
                        else:
                            pump_id = self.env['technotrade.pump'].create({'name':  p["PumpId"]})
                            logging.warning(pump_id)

                    logging.warning('test')


        return True


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    transaction_id = fields.One2many('pos_technotrade.transaction','pos_order_line_id','Transaction')

    def _order_line_fields(self, line, session_id):
        res = super()._order_line_fields(line, session_id)
        logging.warning('res ------<')
        logging.warning(res)
        logging.warning(line)
        logging.warning('')
        x_transaction = False
        if line and line[2] and 'transaction' in line[2]:
            x_transaction = line[2]['transaction']
        res[2]['transaction_id']=[[6, False,[x_transaction]]]
        logging.warning(res)
        logging.warning('')
        logging.warning('')
        return res
