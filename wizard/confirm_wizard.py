from odoo import models, fields, api

class confirm_wizard(models.TransientModel):
    _name = 'pos_technotrade.confirm_wizard'


    def accept(self):
        return {'type': 'ir.actions.act_window_close'}
