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
        url = "https://epikpts.ddns.net/jsonPTS"
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
        logging.warning(table_id)
        logging.warning(date_start)
        logging.warning(date_end)
        #ds = date_start[0].split('.')[0]
        #de = str(date_end[0].split('.')[0])
        #ds = "2022-11-23T19:26:54"
        #de = "2022-11-24T19:26:54"
        #logging.warning(ds)
        #table_id = self.env['restaurant.table'].search([('id','=',table_id[0])])
        table_id = 1
        pump_ids = self.env['technotrade.pump'].search([])
        transactions = []
        if len(pump_ids):
            for p in pump_ids:
                data =''' {
                    "Protocol":"jsonPTS",
                    "Packets": [{
                        "Id": 1,
                        "Type": "ReportGetPumpTransactions",
                        "Data":{
                            "Pump": ''' +str(p.name)+ ''',
                            "DateTimeStart": '''+'''"'''+ str(date_start[0])+'''"'''+''',
                            "DateTimeEnd": '''+'''"'''+ str(date_end[0])+ '''"'''+''',
                        }

                    }]
                }'''
                logging.warning(data)
                response_technotrade = self.technotrade_connection(data)
                logging.warning("RESPONSE TECHNOTRASE report_pump_transactions")
                logging.warning(response_technotrade)
                if len(response_technotrade) > 0:
                    logging.warning(response_technotrade[0]["Data"])
                    if "Data" in response_technotrade[0] and len(response_technotrade[0]["Data"]) > 0:
                        product_ids = self.env['product.product'].search([('nozzle','>',0)])
                        logging.warning(product_ids)
                        product_dic = {}
                        if product_ids:
                            for product in product_ids:
                                if int(product.nozzle) not in product_dic:
                                    product_dic[int(product.nozzle)] = product.id
                                #for nozzle in product.nozzle_ids:
                                 #   if int(nozzle.name) not in product_dic:
                                  #      product_dic[int(nozzle.name)] = product.id

                        logging.warning('PRODUCT DIC')
                        logging.warning(product_dic)
                        for data in response_technotrade[0]["Data"]:
                            logging.warning(data)
                            #transaction_exist = self.env['pos.order'].search([('transaction','=',int(data['Transaction'])), ('table_id.pump_id','=', int(data['Pump']) ) ])

                            #Verificamos si existe la transaccion en pos.order.line, para que no la mande de nuevo al frontend
                            transaction_exist = self.env['pos.order.line'].search([('transaction','=', int(data['Transaction']) )])
                            logging.warning(transaction_exist)
                            if len(transaction_exist) == 0:
                                logging.warning(product_dic)
                                logging.warning('no ELIMINA')
                                nozzle_data = int(data["Nozzle"])
                                logging.warning(nozzle_data)
                                data['product_id'] = product_dic[nozzle_data]
                                transactions.append(data)
                                
        logging.warning('RESPONSE  PUPM T')
        logging.warning(transactions)
        return transactions

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
                    product_ids = self.env['product.template'].search([('nozzle','>', 0)])
                    product_dic = {}
                    if len(product_ids)>0:
                        for p in product_ids:
                            if p.nozzle not in product_dic:
                                product_dic[int(p.nozzle)] = p
                                
                    for p in response_technotrade[0]["Data"]["FuelGrades"]:
                        if p["Id"] in product_dic:
                            product_dic[p["Id"]].update({'name':  p["Name"],'nozzle': p["Id"], 'detailed_type': 'product', 'available_in_pos': True, 'list_price': p["Price"]})
                        else:
                            pt = self.env['product.template'].create({'name':  p["Name"], 'nozzle': p["Id"], 'list_price': p["Price"], 'detailed_type': 'product', 'available_in_pos': True})
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

    transaction = fields.Integer('Transaction technotrade')