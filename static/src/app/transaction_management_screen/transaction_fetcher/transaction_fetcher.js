/** @odoo-module */

import { registry } from "@web/core/registry";
import { EventBus } from "@odoo/owl";

class TransactionFetcher extends EventBus {
    static serviceDependencies = ["orm", "pos"];
    constructor({ orm, pos }) {
        super();
        this.currentPage = 1;
        this.nPerPage = 80;
        this.ordersToShow = [];
        this.totalCount = 0;
        this.orm = orm;
        this.pos = pos;
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

    async _fetchTotalCount() {
        const domain_transactions= [['pos_order_line_id', '=', false],['no_show_pos','=',false]]
        // const domain = [["currency_id", "=", this.pos.currency.id]].concat(
        //     this.searchDomain || []
        // );
        this.totalCount = await this.orm.searchCount("pos_technotrade.transaction", domain_transactions);
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
        // Show orders from the backend.
        const offset = this.nPerPage + (this.currentPage - 1 - 1) * this.nPerPage;
        const limit = this.nPerPage;
        this.ordersToShow = await this._fetch(limit, offset);
        await this._fetchTotalCount();

        this.trigger("update");
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
        const sale_orders = await this._getOrderIdsForCurrentPage(limit, offset);

        return sale_orders;
    }
    async _getOrderIdsForCurrentPage(limit, offset) {
        this.pos.set_synch("connecting");
        const domain_transactions= [['pos_order_line_id', '=', false],['no_show_pos','=',false]]
        const transactions = await this.orm.searchRead(
            "pos_technotrade.transaction",
            domain_transactions,
            [
                "id",
                "name",
                "product_id"
                "transaction",
                "nozzle",
                "pump",
                "fuel_grade_name",
                "total_amount",
                "total_volume",
                "fuel_grade_name",
                "datetime",
                "datetime_text",
                "volume",
                "amount",
                "price",
                
            ],
            { offset, limit }
        );
        console.log('transactions')
        console.log(transactions)

        this.pos.set_synch("connected");
        return transactions;
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
        return this.ordersToShow;
    }
    setSearchDomain(searchDomain) {
        this.searchDomain = searchDomain;
    }
    setNPerPage(val) {
        this.nPerPage = val;
    }
    setPage(page) {
        this.currentPage = page;
    }
}

export const TransactionFetcherService = {
    dependencies: TransactionFetcher.serviceDependencies,
    start(env, deps) {
        return new TransactionFetcher(deps);
    },
};

registry.category("services").add("transaction_fetcher", TransactionFetcherService);