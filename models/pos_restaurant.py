# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from odoo.exceptions import UserError

class RestaurantTable(models.Model):

    _inherit = 'restaurant.table'

    pump_id = fields.Many2one('technotrade.pump','Pump')
    