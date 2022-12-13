import base64
import json
import logging

from odoo import http

from odoo.http import request, Response
from odoo.http import JsonRPCDispatcher
from odoo.tools.translate import _
from odoo.tools import date_utils
import logging
import requests
_logger = logging.getLogger(__name__)


class JsonRPCDispatcherPatch(JsonRPCDispatcher):

    def _response(self, result=None, error=None):
        request_id = self.jsonrequest.get('id')
        response = {'jsonrpc': '1.0', 'id': request_id}

        if error is not None:
            response['error'] = error
        if result is not None:
            response['result'] = result
            if "Packets" in result:
                logging.warning('response ibriman')
                response = result
                logging.warning(response)

        return self.request.make_json_response(response)
