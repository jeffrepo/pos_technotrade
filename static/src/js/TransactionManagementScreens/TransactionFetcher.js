odoo.define('pos_technotrade.TransactionFetcher', function (require) {
    'use strict';

    const { Gui } = require('point_of_sale.Gui');
    const { isConnectionError } = require('point_of_sale.utils');

    const { EventBus } = owl;

    class TransactionFetcher extends EventBus {
        constructor() {
            super();
            this.currentPage = 1;
            this.ordersToShow = [];
            this.transactionToShow = [];
            this.totalCount = 0;
        }


        /**
         * for nPerPage = 10
         * +--------+----------+
         * | nItems | lastPage |
         * +--------+----------+
         * |     2  |       1  |
         * |    10  |       1  |
         * |    11  |       2  |
         * |    30  |       3  |
         * |    35  |       4  |
         * +--------+----------+
         */
        get lastPage() {
            const nItems = this.totalCount;
            return Math.trunc(nItems / (this.nPerPage + 1)) + 1;
        }
        /**
         * Calling this methods populates the `ordersToShow` then trigger `update` event.
         * @related get
         *
         * NOTE: This is tightly-coupled with pagination. So if the current page contains all
         * active orders, it will not fetch anything from the server but only sets `ordersToShow`
         * to the active orders that fits the current page.
         */
        async fetch() {
            try {
                let limit, offset;
                // Show orders from the backend.
                offset =
                    this.nPerPage +
                    (this.currentPage - 1 - 1) *
                        this.nPerPage;
                limit = this.nPerPage;
                this.ordersToShow = false;
                this.transactionToShow = await this._fetch(limit, offset);

                this.trigger('update');
            } catch (error) {
                if (isConnectionError(error)) {
                    Gui.showPopup('ErrorPopup', {
                        title: this.comp.env._t('Network Error'),
                        body: this.comp.env._t('Unable to fetch transactions if offline.'),
                    });
                    Gui.setSyncStatus('error');
                } else {
                    throw error;
                }
            }
        }
        /**
         * This returns the orders from the backend that needs to be shown.
         * If the order is already in cache, the full information about that
         * order is not fetched anymore, instead, we use info from cache.
         *
         * @param {number} limit
         * @param {number} offset
         */
        async _fetch(limit, offset) {
            const sale_orders = [];
            let currentPOSOrder = this.comp.env.pos.orders;
            console.log('currentPOSOrder');
            console.log(currentPOSOrder);
            var order_transaction_exist = [];
            if (currentPOSOrder && currentPOSOrder.length>0){
                currentPOSOrder.forEach(order => {
                    console.log('orde fetch')
                    console.log(order)
                    if (order.orderlines && order.orderlines.length > 0){

                        order.orderlines.forEach(line => {
                            console.log('order line')
                            console.log(line)
                            if ( line.transaction){
                                order_transaction_exist.push(line.transaction);
                            }
                        });
                    }
                });
            }
            console.log('order_transaction_exist')
            console.log(order_transaction_exist)
            if (order_transaction_exist.length > 0){
                console.log('si es mayoe que ')
            }
            const server_transactions = await this._getTransactionsForCurrentPage();
            const new_server_transaction = [];
            if (server_transactions && server_transactions.length > 0){
                        server_transactions.forEach(transaction => {

                            if ( order_transaction_exist.includes(transaction.id) ){
                                console.log('si exta');
                            }else{
                                new_server_transaction.push(transaction)
                            }
                        });

            }
            console.log('_fetch in fetcher.js')
            console.log(sale_orders)
            console.log(server_transactions)
            this.totalCount = new_server_transaction.length;
            console.log(' this.totalCount')
            console.log(this.totalCount)


            return new_server_transaction;
        }
        async _getOrderIdsForCurrentPage(limit, offset) {
            let domain = [['currency_id', '=', this.comp.env.pos.currency.id]].concat(this.searchDomain || []);
            return await this.rpc({
                model: 'sale.order',
                method: 'search_read',
                args: [domain, ['name', 'partner_id', 'amount_total', 'date_order', 'state', 'user_id', 'amount_unpaid'], offset, limit],
                context: this.comp.env.session.user_context,
            });
        }

        async _getTransactionsForCurrentPage() {
            var date_end = new Date();
            var date_start = new Date();
            date_start.setHours(date_end.getHours()-48)
            return await this.rpc({
                model: 'pos.order',
                method: 'report_pump_transactions',
                args: [[], [1],[date_start.toISOString().split('.')[0]],[date_end.toISOString().split('.')[0]]],
                context: this.comp.env.session.user_context,
            });
        }
        nextPage() {
            if (this.currentPage < this.lastPage) {
                this.currentPage += 1;
                this.fetch();
            }
        }
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage -= 1;
                this.fetch();
            }
        }
        /**
         * @param {integer|undefined} id id of the cached order
         * @returns {Array<models.Order>}
         */
        get(id) {
            //return this.transasctionToShow;
            console.log('GET ID')
            console.log(id)
            return this.transactionToShow;
        }
        setSearchDomain(searchDomain) {
            this.searchDomain = searchDomain;
        }
        setComponent(comp) {
            this.comp = comp;
            return this;
        }
        setNPerPage(val) {
            this.nPerPage = val;
        }
        setPage(page) {
            this.currentPage = page;
        }

        async rpc() {
            Gui.setSyncStatus('connecting');
            const result = await this.comp.rpc(...arguments);
            Gui.setSyncStatus('connected');
            return result;
        }
    }

    return new TransactionFetcher();
});
