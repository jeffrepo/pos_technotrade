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

class PosRoute(http.Controller):


    def alternative_json_response(self, result=None, error=None):
        if error is not None:
            response = error
        if result is not None:
            response = result
        mime = 'application/json'
        body = json.dumps(response, default=date_utils.json_default)
        return Response(
            body, status=error and error.pop('http_status', 200) or 200,
            headers=[('Content-Type', mime), ('Content-Length', len(body))]
        )

    @http.route('/web/transaction', type='json', methods=['POST'],auth='none', csrf=False)
    def get_sessions(self):

        logging.warning('EXTERNAL POS TECHNOTRADE CONECTION HTTP')
        json_data = json.loads(request.httprequest.data)
        logging.warning(json_data)
        if json_data:
            if 'Packets' in json_data and len(json_data['Packets']) > 0:
                for p in json_data['Packets']:
                    if 'Type' in p and 'UploadPumpTransaction' == p['Type'] and 'Data' in p:
                        transaction = p['Data']['Transaction']
                        transaction_exist = request.env['pos_technotrade.transaction'].sudo().search([('transaction','=', transaction )])

                        if len(transaction_exist) == 0:
                            transaction_dic = {
                                'transaction': p['Data']['Transaction'],
                                'pump':  p['Data']['Pump'],
                                'nozzle': p['Data']['Nozzle'],
                                'fuel_grade_id': p['Data']['FuelGradeId'],
                                'fuel_grade_name': p['Data']['FuelGradeName'],
                                'datetime_text': p['Data']['DateTime'],
                                'volumne': p['Data']['Volume'],
                                'amount': p['Data']['Amount'],
                                'price': p['Data']['Price'],
                                'total_volume': p['Data']['TotalVolume'],
                                'total_amount': p['Data']['TotalAmount'],
                            }
                            transaction_id = request.env['pos_technotrade.transaction'].sudo().create(transaction_dic)
                            if len(transaction_id) > 0:
                                logging.warning('transaction_id')
                                logging.warning(transaction_id)
                                data = ''' {
                                "Protocol": "jsonPTS",
                                "Packets": [{
                                    "Id": 1,
                                    "Type": "RequestMessageType",
                                    "Message": "OK"
                                }]
                                } '''
                            else:
                                logging.warning('no pudo ser creada')
                                data = '''
                                    {
                                    "Protocol": "jsonPTS",
                                    "Packets": [{
                                        "Id": 1,
                                        "Type": "RequestMessageType",
                                        "Error": true,
                                        "Code": 1,
                                        "Message": "Couldn't been created",
                                    }]
                                    }
                                '''
                        else:
                            logging.warning('ya existe')
                                data = '''
                                    {
                                    "Protocol": "jsonPTS",
                                    "Packets": [{
                                        "Id": 1,
                                        "Type": "RequestMessageType",
                                        "Error": true,
                                        "Code": 1,
                                        "Message": "Couldn't been created Again",
                                    }]
                                    }
                                '''

        return data
