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

class PosTechnotradeTransaction(models.Model):
    _name = "pos_technotrade.transaction"

    name = fields.Char('Nombre')
    transaction = fields.Integer('Transaction')
    pump = fields.Integer('Pump')
    nozzle = fields.Integer('Nozzle')
    fuel_grade_id = fields.Integer('Fuel grade id')
    fuel_grade_name = fields.Char('Fuel grade name')
    datetime = fields.Datetime('Datetime')
    datetime_text = fields.Char('Datetime Text')
    volume = fields.Float('Volune')
    amount = fields.Float('Amount')
    price = fields.Float('price')
    total_volume = fields.Float('Total volume')
    total_amount = fields.Float('Total amount')
    configuration_id = fields.Char('ConfigurationId')
    request_id = fields.Integer('Packet')
    product_id = fields.Many2one('product.product')
    pos_order_line_id = fields.Many2one('pos.order.line','Order line')
    no_show_pos = fields.Boolean('Not show in POS')

class PosTechnotradePlateNumber(models.Model):
    _name = "pos_technotrade.plate_number"

    name = fields.Char('Numero de matricula')
