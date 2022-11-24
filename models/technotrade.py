# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging
from odoo import api, fields, models, tools, _

class TechnotradeNozzle(models.Model):
    _name = "technotrade.nozzle"
    
    name = fields.Char('Nombre o Id')
    
class TechnotradePump(models.Model):
    _name = "technotrade.pump"
    
    name = fields.Char('Nombre')