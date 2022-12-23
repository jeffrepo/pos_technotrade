odoo.define('pos_technotrade.TransactionRow', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const utils = require('web.utils');

    /**
     * @props {models.Order} order
     * @props columns
     * @emits click-order
     */
    class TransactionRow extends PosComponent {
        get order() {
            console.log('GET ORDER TRANSACTIONOROW')
            console.log(this.props.order)
            return this.props.order;
        }
        get highlighted() {
            const highlightedOrder = this.props.highlightedOrder;
            const highlightedTransaction = this.props.highlightedTransaction;
            console.log('highlighted rows this.props.highlightedTransaction')
            console.log(this)
            return !highlightedTransaction ? false : highlightedTransaction.backendId === this.props.order.backendId;
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
            return moment(this.order.date).format('YYYY-MM-DD GGGG, hh:mm A');
        }
        get partner() {
            const partner = this.order.partner_id;
            return partner ? partner[1] : null;
        }
        get total() {
            return this.env.pos.format_currency(this.order.amount_total);
        }
        /**
         * Returns true if the order has unpaid amount, but the unpaid amount
         * should not be the same as the total amount.
         * @returns {boolean}
         */
        get showAmountUnpaid() {
            const isFullAmountUnpaid = utils.float_is_zero(Math.abs(this.order.amount_total - this.order.amount_unpaid), this.env.pos.currency.decimal_places);
            return !isFullAmountUnpaid && !utils.float_is_zero(this.order.amount_unpaid, this.env.pos.currency.decimal_places);
        }
        get amountUnpaidRepr() {
            return this.env.pos.format_currency(this.order.amount_unpaid);
        }
        get state() {
            let state_mapping = {
              'draft': this.env._t('Quotation'),
              'sent': this.env._t('Quotation Sent'),
              'sale': this.env._t('Sales Order'),
              'done': this.env._t('Locked'),
              'cancel': this.env._t('Cancelled'),
            };

            return state_mapping[this.order.state];
        }
        get salesman() {
            const salesman = this.order.user_id;
            return salesman ? salesman[1] : null;
        }
    }
    TransactionRow.template = 'TransactionRow';

    Registries.Component.add(TransactionRow);
    
    console.log('RETURN TRANSACTIONROW');
    console.log(TransactionRow);
    return TransactionRow;
});
