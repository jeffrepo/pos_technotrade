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
    
    nozzle = fields.Char('Nozzle')
    
    def technotrade_connection(self, data):
        url = "https://epikpts.ddns.net/jsonPTS"
        headers = {
          'Content-Type': 'application/json',
          #'Authorization': 'Bearer '+str(refresh_token_config)
        }        
        
        logging.warning('technotrade_connection')
        response = requests.post(url, data = data,auth=HTTPDigestAuth('admin', 'admin'), headers = headers, verify=False)
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
            
        
    def report_pump_transactions(self, pump):
        logging.warning('ENTRA report_pump_transactions')
        logging.warning(pump)
        data =""" {
            "Protocol":"jsonPTS",
            "Packets": [{
                "Id": 1,
                "Type": "ReportGetPumpTransactions",
                "Data":{
                    "Pump":1,
                    "DateTimeStart":"2022-05-19T12:45:14",
                    "DateTimeEnd":"2022-11-16T13:45:14"
                }
                
            }]
        }"""
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
                        if product.nozzle not in product_dic:
                            product_dic[product.nozzle] = product.id
                            
                for data in response_technotrade[0]["Data"]:
                    nozzle = data["Nozzle"]
                    data['product_id'] = product_dic[nozzle]
                    
        return response_technotrade