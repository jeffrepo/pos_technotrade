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
        
        data = {"code": 300, "message": "error"}

        return data

