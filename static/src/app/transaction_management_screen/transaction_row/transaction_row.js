/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { deserializeDateTime } from "@web/core/l10n/dates";

/**
 * @props {models.Order} order
 * @props columns
 * @emits click-order
 */
export class TransactionRow extends Component {
    static template = "pos_technotrade.TransactionRow";

    setup() {
        console.log("TransactionRow setup")
        this.ui = useState(useService("ui"));
    }
    get order() {
        console.log("TransactionRow")
        return this.props.order;
    }
    get highlighted() {
        const highlightedOrder = this.props.highlightedOrder;
        console.log("highlightedOrder")
        console.log(highlightedOrder)
        return !highlightedOrder
            ? false
            : highlightedOrder.backendId === this.props.order.backendId;
    }

    // Column getters //
    get name() {
        console.log('get name')
        console.log(this.order)
        return this.order.name;
    }
    get transaction(){
        console.log('Transaction id')
        console.log(this.order.transaction)
        return this.order.transaction
    }
    get nozzle(){
        return this.order.nozzle
    }
    
    get pump(){
        return this.order.pump
    }
    get fuel_grade_name(){
        return this.order.fuel_grade_name
    }
    get volume(){
        return this.order.volume
    }
    get amount(){
        console.log("amount")
        console.log(this.order)
        return this.order.amount
    }
    get price(){
        return this.order.price
    }
    get total_volume(){
        return this.order.total_volume
    }            
    get totalamount(){
        return this.order.total_amount
    } 
    get date() {
        console.log(this.order.datetime)
        return deserializeDateTime(this.order.datetime).toFormat('yyyy-MM-dd HH:mm a');
    }
    
    // get name() {
    //     return this.order.name;
    // }
    // get date() {
    //     return deserializeDateTime(this.order.date_order).toFormat("yyyy-MM-dd HH:mm a");
    // }
    // get partner() {
    //     const partner = this.order.partner_id;
    //     return partner ? partner[1] : null;
    // }
    // get total() {
    //     return this.env.utils.formatCurrency(this.order.amount_total);
    // }
    /**
     * Returns true if the order has unpaid amount, but the unpaid amount
     * should not be the same as the total amount.
     * @returns {boolean}
     */

    // get amountUnpaidRepr() {
    //     return this.env.utils.formatCurrency(this.order.amount_unpaid);
    // }
    // get state() {
    //     const state_mapping = {
    //         draft: _t("Quotation"),
    //         sent: _t("Quotation Sent"),
    //         sale: _t("Sales Order"),
    //         done: _t("Locked"),
    //         cancel: _t("Cancelled"),
    //     };

    //     return state_mapping[this.order.state];
    // }
}