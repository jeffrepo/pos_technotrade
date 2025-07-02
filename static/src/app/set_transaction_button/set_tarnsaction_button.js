/** @odoo-module */

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { Component } from "@odoo/owl";

export class SetTransactionButton extends Component {
    static template = "pos_technotrada.SetTransactionButton";
    setup() {
        this.pos = usePos();
    }
    async click() {
        this.pos.showScreen("TransactionManagementScreen");
    }
}

ProductScreen.addControlButton({ component: SetTransactionButton });
