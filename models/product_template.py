# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools, _


class ProductTemplate(models.Model):
    _inherit = "product.template"

    nozzle = fields.Integer('Nozzle')