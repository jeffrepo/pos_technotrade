import base64
import json
import logging

from odoo import http

from odoo.http import request, Response
from odoo.tools.translate import _
from odoo.tools import date_utils
import logging
import requests
_logger = logging.getLogger(__name__)
from odoo.http import JsonRPCDispatcher
from dateutil import parser
from datetime import datetime, timedelta

class PosRoute(http.Controller):


    def alternative_json_response(self, result=None, error=None):
        if error is not None:
            response = error
        if result is not None:
            response = result
        mime = 'application/json'
        body = json.dumps(response, default=date_utils.json_default)
        logging.warning('BODY JEFF')
        logging.warning(response)
        logging.warning(body)
        return Response(
            body, status=error and error.pop('http_status', 200) or 200,
            headers=[('Content-Type', mime), ('Content-Length', len(body))]
        )

    @http.route('/web/transaction', type='json', methods=['POST'],auth='none', csrf=False)
    def get_sessions(self):

        logging.warning('EXTERNAL POS TECHNOTRADE CONECTION HTTP')
        json_data = json.loads(request.httprequest.data)
        logging.warning(json_data)
        data = {}
        if json_data:
            if 'Packets' in json_data and len(json_data['Packets']) > 0:
                for p in json_data['Packets']:
                    if 'Type' in p and 'UploadPumpTransaction' == p['Type'] and 'Data' in p:
                        transaction = p['Data']['Transaction']
                        pump = p['Data']['Pump']
                        nozzle = p['Data']['Nozzle']
                        transaction_exist = request.env['pos_technotrade.transaction'].sudo().search([('transaction','=', transaction ),('pump','=', pump ),('nozzle','=', nozzle )])

                        if len(transaction_exist) == 0:
                            product_product = request.env['product.product'].sudo().search([('fuel_grade_id','>', 0)])
                            new_dic_p = {}
                            for pr in product_product:
                                if pr.fuel_grade_id not in new_dic_p:
                                    new_dic_p[pr.fuel_grade_id] = pr
                            
                            transaction_dic = {
                                'transaction': p['Data']['Transaction'],
                                'pump':  p['Data']['Pump'],
                                'request_id': p['Id'],
                                'nozzle': p['Data']['Nozzle'],
                                'fuel_grade_id': p['Data']['FuelGradeId'] if 'FuelGradeId' in p['Data'] else 0 ,
                                'fuel_grade_name': p['Data']['FuelGradeName'] if 'FuelGradeName' in p['Data'] else '',
                                'datetime': parser.parse(t.datetime_text),
                                'datetime_text': p['Data']['DateTime'],
                                'volumne': p['Data']['Volume'],
                                'amount': p['Data']['Amount'],
                                'price': p['Data']['Price'],
                                'product_id': new_dic_p[p['Data']['FuelGradeId']].id if 'FuelGradeId' in p['Data'] else False,
                                'total_volume': p['Data']['TotalVolume'],
                                'total_amount': p['Data']['TotalAmount'],
                            }
                            transaction_id = request.env['pos_technotrade.transaction'].sudo().create(transaction_dic)
                            if len(transaction_id) > 0:
                                logging.warning('transaction_id')
                                logging.warning(transaction_id)
                                new_time = transaction_id.datetime + timedelta(hours=6)
                                transaction_id.update({'datetime': new_time})
                                
                                data =  {
                                "Protocol": "jsonPTS",
                                "Packets": [{
                                    "Id": p['Id'],
                                    "Type": "UploadPumpTransaction",
                                    "Message": "OK",
                                }]
                                }
                            else:
                                logging.warning('no pudo ser creada')
                                data = {
                                    "Protocol": "jsonPTS",
                                    "Packets": [{
                                        "Id": p['Id'],
                                        "Type": "UploadPumpTransaction",
                                        "Error": True,
                                        "Code": 1,
                                        "Message": "Couldn't been created",
                                    }]
                                    }

                        else:
                            data =  {
                                "Protocol": "jsonPTS",
                                "Packets": [{
                                    "Id": p['Id'],
                                    "Type": "UploadPumpTransaction",
                                    "Message": "OK",
                                }]
                                }


        logging.warning(data)
        return data
