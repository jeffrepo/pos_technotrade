# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools, _


class ProductTemplate(models.Model):
    _inherit = "product.template"

    nozzle_ids = fields.Many2many('technotrade.nozzle',string='Nozzles')
    nozzle = fields.Integer('Nozzle')