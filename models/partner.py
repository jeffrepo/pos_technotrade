# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import time
import logging

from psycopg2 import sql, DatabaseError

from odoo import api, fields, models, _
from odoo.osv import expression
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT, mute_logger
from odoo.exceptions import ValidationError, UserError
from odoo.addons.base.models.res_partner import WARNING_MESSAGE, WARNING_HELP


class ResPartner(models.Model):
    _inherit = 'res.partner'


    def values_partner(self, partner_id, amount):
        logging.warning('Welcome to values_partner')
        partner = self.env['res.partner'].search([('id', '=', partner_id)])
        if partner:
            if partner.use_partner_credit_limit:
                if partner.property_payment_term_id:
                    logging.warning('partner.property_payment_term_id')

                    if partner.property_payment_term_id.line_ids[0].months != 0 or partner.property_payment_term_id.line_ids[0].days != 0:

                        new_amount = amount + partner.credit
                        logging.warning('new_amount')
                        logging.warning(new_amount)
                        logging.warning(partner.credit_limit)
                        if new_amount <= partner.credit_limit:
                            return True
                        else:
                            return "Crédito excedido"
                    else:
                        logging.warning('Plazo de pago incorrecto')
                        return "Plazo de pago incorrecto"
                else:
                    logging.warning("No hay un plazo de pago seleccionado")
                    return "No hay un plazo de pago seleccionado"
            else:
                return "Cliente sin autorización de credito"
