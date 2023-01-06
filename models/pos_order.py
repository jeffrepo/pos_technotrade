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
from datetime import datetime, timedelta
from dateutil import parser
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

    def get_plate_number_list(self, current_partner):
        plate_numbers_list = []
        plate_number_ids = self.env['res.partner.plate_number_line'].search([('partner_id','=', current_partner[0])])
        if plate_number_ids:
            for p in plate_number_ids:
                dic_plate = {
                    'id': p.id,
                    'name': p.plate_number_id.name,
                }
                plate_numbers_list.append(dic_plate)
        else:
            raise UserError(_("Cliente no tiene matricula asignada"))
        return plate_numbers_list
    
    def return_transactions(self):
        for order in self:
            transactions_list_done = []
            if order.is_refunded and order.lines:
                for line in order.lines:
                    if line.transaction_id:
                        transactions_list_done.append(line.transaction_id)
                        line.transaction_id.pos_order_line_id = False
            if len(transactions_list_done) > 0:
                return {
                    'name': 'LIBERACIÓN DE DESPACHOS EXITOSO',
                    'type': 'ir.actions.act_window',
                    'res_model': 'pos_technotrade.confirm_wizard',
                    'view_mode': 'form',
                    'view_type': 'form',
                    'target': 'new',
                }
            else:
                return {
                    'name': 'No hay despacho de combustible para liberar en este Pedido',
                    'type': 'ir.actions.act_window',
                    'res_model': 'pos_technotrade.confirm_wizard',
                    'view_mode': 'form',
                    'view_type': 'form',
                    'target': 'new',
                }
    
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
        search_transactions = self.env['pos_technotrade.transaction'].search([('pos_order_line_id', '=', False),('no_show_pos','=',False)], order='id desc')

        logging.warning('TRANSACTION')
        logging.warning(search_transactions)
        logging.warning(len(search_transactions))
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
            'volume':trans.volume,
            'amount':trans.amount,
            'price':trans.price
            })
        logging.warning('transactions')
        logging.warning(transactions)
        return transactions

    def update_datetime_transaction(self):
        transactions_id = self.env['pos_technotrade.transaction'].search([('product_id','!=', False)])
        if transactions_id:
            for t in transactions_id:
                t.update({'datetime': parser.parse(t.datetime_text)})
                new_time = t.datetime + timedelta(hours=3)
                t.update({'datetime': new_time})
        return True
    
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
    driver = fields.Char('Chofer')
    plate_number_id = fields.Many2one('pos_technotrade.plate_number','Matrícula')

    def _order_line_fields(self, line, session_id):
        res = super()._order_line_fields(line, session_id)
        logging.warning('res ------<')
        logging.warning(res)
        logging.warning(line)
        logging.warning('')
        x_transaction = False
        if line and line[2] and 'transaction' in line[2]:
            if 'driver' in line[2]:
                res[2]['driver'] = line[2]['driver']
            if 'plate_number_id' in line[2]:
                plate_number_exist = self.env['pos_technotrade.plate_number'].search([('id','=',int(line[2]['plate_number_id']))])
                if len(plate_number_exist) > 0:
                    res[2]['plate_number_id'] = line[2]['plate_number_id']
                else:
                    raise UserError(_("Matrícula no existe"))
            x_transaction = line[2]['transaction']
            exist_transaction = self.env['pos_technotrade.transaction'].search([('id','=',x_transaction),('pos_order_line_id', '!=', False)])
            if len(exist_transaction) > 0:
                raise UserError(_("Transaccion ya está en otro pedido"))
            else:
                res[2]['transaction_id']=[[6, False,[x_transaction]]]
                logging.warning(res)
                logging.warning('')
                logging.warning('')
                return res
        else:
            return res
