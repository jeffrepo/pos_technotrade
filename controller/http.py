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
        res = super(JsonRPCDispatcherPatch, self)._response(result,error)
        logging.warning('res response')
        logging.warning(result)
        logging.warning(res)

        if type(result) is dict:
            if "Packets" in result:
                return self.request.make_json_response(result)
            else:
                return res
        else:
            return res
