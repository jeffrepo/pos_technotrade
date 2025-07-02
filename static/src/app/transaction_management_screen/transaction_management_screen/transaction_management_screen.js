/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { sprintf } from "@web/core/utils/strings";
import { parseFloat } from "@web/views/fields/parsers";
import { floatIsZero } from "@web/core/utils/numbers";
import { useBus, useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { ControlButtonsMixin } from "@point_of_sale/app/utils/control_buttons_mixin";
import { Orderline } from "@point_of_sale/app/store/models";

import { SelectionPopup } from "@point_of_sale/app/utils/input_popups/selection_popup";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";

import { TransactionList } from "@pos_technotrade/app/transaction_management_screen/transaction_list/transaction_list";
import { TransactionManagementControlPanel } from "@pos_technotrade/app/transaction_management_screen/transaction_management_control_panel/transaction_management_control_panel";
import { Component, onMounted, useRef } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";

/**
 * ID getter to take into account falsy many2one value.
 * @param {[id: number, display_name: string] | false} fieldVal many2one field value
 * @returns {number | false}
 */
function getId(fieldVal) {
    return fieldVal && fieldVal[0];
}

export class TransactionManagementScreen extends ControlButtonsMixin(Component) {
    static storeOnOrder = false;
    static components = { TransactionList, TransactionManagementControlPanel };
    static template = "pos_technotrade.TransactionManagementScreen";

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.root = useRef("root");
        this.numberBuffer = useService("number_buffer");
        this.transactionFetcher = useService("transaction_fetcher");
        this.notification = useService("pos_notification");

        useBus(this.transactionFetcher, "update", this.render);

        onMounted(this.onMounted);
    }
    onMounted() {
        this.transactionFetcher.fetch();
    }
    _getSaleOrderOrigin(order) {
        for (const line of order.get_orderlines()) {
            if (line.sale_order_origin_id) {
                return line.sale_order_origin_id;
            }
        }
        return false;
    }
    get selectedPartner() {
        const order = this.pos.orderManagement.selectedOrder;
        return order ? order.get_partner() : null;
    }
    get orders() {
        return this.transactionFetcher.get();
    }
    async _setNumpadMode(event) {
        const { mode } = event.detail;
        this.numpadMode = mode;
        this.numberBuffer.reset();
    }
    onNextPage() {
        this.transactionFetcher.nextPage();
    }
    onPrevPage() {
        this.transactionFetcher.prevPage();
    }
    onSearch(domain) {
        this.transactionFetcher.setSearchDomain(domain);
        this.transactionFetcher.setPage(1);
        this.transactionFetcher.fetch();
    }
    async onClickSaleOrder(clickedOrder) {
        const { confirmed, payload: selectedOption } = await this.popup.add(SelectionPopup, {
            title: _t("What do you want to do?"),
            list: [
                { id: "0", label: _t("Settle the order"), item: "settle" },
                {
                    id: "1",
                    label: _t("Apply a down payment (percentage)"),
                    item: "dpPercentage",
                },
                {
                    id: "2",
                    label: _t("Apply a down payment (fixed amount)"),
                    item: "dpAmount",
                },
            ],
        });


        let currentPOSOrder = this.pos.get_order();
        let transaction_x = clickedOrder.id;
        let product_x = this.pos.db.get_product_by_id(clickedOrder.product_id)
        const line_values = {
            pos: this.pos,
            order: this.pos.get_order(),
            product: product_x,
            description: clickedOrder.fuel_grade_name,
            price: line.price_unit,
            transaction: transaction_x,
            nozzle: clickedOrder.nozzle,
            pump: clickedOrder.pump,
            //tax_ids: taxIds,
            price_manually_set: false,
            price_type: "automatic",
            //sale_order_origin_id: clickedOrder,
            //sale_order_line_id: line,
            //customer_note: line.customer_note,
        };
        const new_line = new Orderline({ env: this.env }, line_values);
        this.pos.get_order().add_orderline(new_line);
        this.pos.closeScreen();

    }

    _createDownpaymentLines(sale_order, total_down_payment, clickedOrder, down_payment_product) {
        //This function will create all the downpaymentlines. We will create one downpayment line per unique tax combination
        const percentage = total_down_payment / sale_order.amount_total;
        const grouped = {};
        sale_order.order_line.forEach((obj) => {
            const sortedTaxes = obj.tax_id.slice().sort((a, b) => a - b);
            const key = sortedTaxes.join(",");
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(obj);
        });

        // We need one unique line for the fixed amount taxes
        let fixed_taxes_downpayment = 0;
        const fixed_taxes_tab = [];
        const down_payment_line_to_create = [];

        Object.keys(grouped).forEach((key) => {
            const group = grouped[key];
            const tab = group.map((line) => ({
                product_name: line.product_id[1],
                product_uom_qty: line.product_uom_qty,
                price_unit: line.price_unit,
                total: line.price_total,
            }));

            // We compute the values for the fixed taxes downpayment
            const fixed_taxes = group[0].tax_id.filter(
                (id) => this.pos.taxes_by_id[id].amount_type === "fixed"
            );
            const total_qty = group.reduce((total, line) => (total += line.product_uom_qty), 0);
            fixed_taxes.forEach((tax_id) => {
                const tax = this.pos.taxes_by_id[tax_id];
                fixed_taxes_downpayment += tax.amount * total_qty * percentage;
                fixed_taxes_tab.push(tab);
            });

            // We need to remove the amount of the fixed tax as they will have a separate line
            const fixed_tax_total_amount = fixed_taxes.reduce((total, tax_id) => {
                const tax = this.pos.taxes_by_id[tax_id];
                return total + tax.amount;
            }, 0);
            const total_price = group.reduce(
                (total, line) =>
                    (total += line.price_total - line.product_uom_qty * fixed_tax_total_amount),
                0
            );
            const down_payment_line_price = total_price * percentage;
            // We apply the taxes and keep the same price
            const taxes_to_apply = group[0].tax_id
                .filter((id) => this.pos.taxes_by_id[id].amount_type !== "fixed")
                .map((id) => {
                    return { ...this.pos.taxes_by_id[id], price_include: true };
                });
            const tax_res = this.pos.compute_all(
                taxes_to_apply,
                down_payment_line_price,
                1,
                this.pos.currency.rounding
            );
            let new_price = tax_res["total_excluded"];
            new_price += tax_res.taxes
                .filter((tax) => this.pos.taxes_by_id[tax.id].price_include)
                .reduce((sum, tax) => (sum += tax.amount), 0);
            down_payment_line_to_create.push({
                price: new_price,
                tab: tab,
                tax_ids: group[0].tax_id.filter(
                    (id) => this.pos.taxes_by_id[id].amount_type !== "fixed"
                ),
            });
        });

        if (fixed_taxes_downpayment !== 0) {
            // We try to merge the fixed taxes in one line that has no tax if possible
            const line = down_payment_line_to_create.find((line) => !line.tax_ids.length);
            if (line) {
                line.price += fixed_taxes_downpayment;
            } else {
                down_payment_line_to_create.push({
                    price: fixed_taxes_downpayment,
                    tab: fixed_taxes_tab.flat(),
                    tax_ids: [],
                });
            }
        }
        for (const down_payment_line of down_payment_line_to_create) {
            this.pos.get_order().add_orderline(
                new Orderline(
                    { env: this.env },
                    {
                        pos: this.pos,
                        order: this.pos.get_order(),
                        product: down_payment_product,
                        price: down_payment_line.price,
                        price_type: "automatic",
                        sale_order_origin_id: clickedOrder,
                        down_payment_details: down_payment_line.tab,
                        tax_ids: down_payment_line.tax_ids,
                    }
                )
            );
        }
    }

    async _getSaleOrder(id) {
        const [sale_order] = await this.orm.read(
            "sale.order",
            [id],
            [
                "order_line",
                "partner_id",
                "pricelist_id",
                "fiscal_position_id",
                "amount_total",
                "amount_untaxed",
                "amount_unpaid",
                "picking_ids",
                "partner_shipping_id",
                "partner_invoice_id",
            ]
        );

        const sale_lines = await this._getSOLines(sale_order.order_line);
        sale_order.order_line = sale_lines;

        return sale_order;
    }

    async _getSOLines(ids) {
        const so_lines = await this.orm.call("sale.order.line", "read_converted", [ids]);
        return so_lines;
    }
}

registry.category("pos_screens").add("TransactionManagementScreen", TransactionManagementScreen);