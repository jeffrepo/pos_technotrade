# -*- coding: utf-8 -*-
{
    'name': "POS Technotrade",

    'summary': """ POS Technotrade """,

    'description': """
        Sincronización con dispositivo para gasolineras usando el controlador Technotrade
    """,

    'author': "STECHNOLOGIES",
    'website': "",

    'category': 'Uncategorized',
    'version': '0.1',

    'depends': ['point_of_sale','pos_restaurant','web'],

    'data': [
        'views/product_template_views.xml',
        'views/product_views.xml',
    ],
    'assets':{
        'point_of_sale.assets': [
            'pos_technotrade/static/src/js/**/*.js',
        ],
        'web.assets_qweb':[
        ],
        'web.assets_backend': [
        ],
    },    
    'qweb': [
    ],
    'license': 'LGPL-3',
}
