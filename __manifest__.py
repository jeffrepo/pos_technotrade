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
    'version': '0.2',

    'depends': ['point_of_sale','web'],

    'data': [
        'views/product_template_views.xml',
        'views/pos_technotrade_views.xml',
        'views/pos_order_view.xml',
        #'views/pos_restaurant_views.xml',
        'views/product_views.xml',
    ],
    'assets':{
        'point_of_sale.assets': [
            'pos_technotrade/static/src/js/**/*.js',
            'pos_technotrade/static/src/xml/**/*.xml',
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
