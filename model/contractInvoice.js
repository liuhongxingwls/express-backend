var utils = require("../helper/utils");
var when = require("when");

module.exports = function(orm, db) {
	var Invoice = db.define("contract_invoice", {
		id: {type: "serial", key: true},
		price: Number,
		user_id: Number,
		create_time: {type: "date", defaultValue: new Date()},
        invoice_time: {type: "date", deafultValue: new Date()},
        invoice_number: {type: "integer", defaultValue: 0}
	});

    Invoice.getInvoiceInfo = function (params) {
        var def = when.defer();
		var pageNo = params.pageNo || 1;
		var prePageNum = 1;
		var invoice = {
			pageIndex: pageNo
		}
        var arrOutput = {
            contract_number: {
                keyword: "like",
                sign: ["%", "%"],
                prefix: "a"
            },
            first_party_name: {
                keyword: "like",
                sign: ["%", "%"],
                prefix: "b"
            },
            second_party_name: {
                keyword: "like",
                sign: ["%", "%"],
                prefix: "c"
            },
            effective_time: {
                keyword: ">",
                prefix: "a"
            },
            end_time: {
                keyword: "<",
                prefix: "a"
            },
            saler_name: {
                keyword: "like",
                sign: ["%", "%"],
                prefix: "a"
            },
            contract_type: "a",
            contract_status: "a",
            invoice_number: {
                keyword: "like",
                sign: ["%", "%"],
                prefix: "e"
            },
            invoice_start_time: {
                keyword: ">",
                prefix: "e",
                mapsTo: "invoice_time"
            },
            invoice_end_time: {
                keyword: "<",
                prefix: "e",
                mapsTo: "invoice_time"
            },
            create_start_time: {
                keyword: ">",
                prefix: "e",
                mapsTo: "create_time"
            },
            create_end_time: {
                keyword: "<",
                prefix: "e",
                mapsTo: "create_time"
            },
        }

        var strCondition = "", arrArgs = [];
        var arrLimit = [(pageNo - 1) * prePageNum, prePageNum];
        var sql;

        // 1表示合同已审核通过,合同状态为执行中
        if(!params.contract_status) {
            params.contract_status = 1;
        }

        // 过滤查询字段,产出关联条件语句及实参数据
        utils.ormFilter(params, arrOutput, function(str, arr) {
            strCondition = str ? " where " + str : "";
            arrArgs = arr;
        });

        sql = "SELECT count(*) invoice_count FROM contract_info a "
            + "LEFT JOIN contract_first_party b ON a.first_party_id = b.id "
            + "LEFT JOIN contract_second_party c ON a.second_party_id = c.id "
            + "LEFT JOIN contract_type d ON a.contract_type = d.id "
            + "LEFT JOIN contract_invoice e ON a.contract_number = e.id "
            + "LEFT JOIN contract_region f ON b.region_id = f.id "
            + "LEFT JOIN area h ON b.province_id = h.id "
            + "LEFT JOIN area i ON b.city_id = i.id "
            + strCondition;

        db.driver.execQuery(sql, arrArgs, function(err, result) {
            if(!err) {
                invoice.count = result[0].invoice_count;

                sql = "SELECT e.invoice_number, e.price AS invoice_price, a.contract_number, b.first_party_name, c.second_party_name,"
                    + "d.contract_type_name,TIMESTAMPDIFF(DAY,DATE_FORMAT(a.end_time, '%Y-%m-%d'),NOW()) AS overdue_days,"
                    + "DATE_FORMAT(a.effective_time, '%Y-%m-%d') AS effective_time, DATE_FORMAT(a.end_time, '%Y-%m-%d') AS end_time,"
                    + "a.contract_price, a.deposit, a.paid_price, a.saler_name, a.contract_status,"
                    + "DATE_FORMAT(e.create_time, '%Y-%m-%d') AS create_time, f.region_name, h.area_name AS province_name, i.area_name AS city_name,"
                    + "DATE_FORMAT(e.invoice_time, '%Y-%m-%d') AS invoice_time FROM contract_info a "
                    + "LEFT JOIN contract_first_party b ON a.first_party_id = b.id "
                    + "LEFT JOIN contract_second_party c ON a.second_party_id = c.id "
                    + "LEFT JOIN contract_type d ON a.contract_type = d.id "
                    + "LEFT JOIN contract_invoice e ON a.contract_number = e.id "
                    + "LEFT JOIN contract_region f ON b.region_id = f.id "
                    + "LEFT JOIN area h ON b.province_id = h.id "
                    + "LEFT JOIN area i ON b.city_id = i.id "
                    + strCondition + " ORDER BY e.invoice_number LIMIT ?,?";


                // 查询发票数据
                db.driver.execQuery(sql, arrArgs.concat(arrLimit), function(err, resultData) {
                    if(!err) {
                        invoice.list = resultData;
                        invoice.totalPageNum = Math.ceil(invoice.count / prePageNum);
                        invoice.pagination = utils.paginationMath(pageNo, invoice.totalPageNum);

                        def.resolve(invoice);
                    }else
                        def.reject(err);

                    console.log(invoice);
                });
            }else
                def.reject(err);
        });

        return def.promise;
	}

    /**
     * 添加发票信息
     * @param params
     */
    Invoice.addContract = function(params) {
        var def = when.defer();

        Invoice.create(params, function(err, items) {
            if(items)
                def.resolve(items);
            else
                def.reject("添加发票信息失败");
        });

        return def.promise;
    }
}