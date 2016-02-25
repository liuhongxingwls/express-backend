var when = require("when");
var utils = require("../helper/utils");
var moment = require("moment");

module.exports = function(orm, db) {
    var Payment = db.define("contract_payment", {
        id: {type: 'serial', key: true},
        bank_id: Number,
        payment: String,
        payment_time: {type: 'date', defaultValue: moment().format("YYYY-MM-DD")},
        user_id: Number,
        create_time: {type: 'date', defaultValue: moment().format("YYYY-MM-DD")}
    });

    Payment.getList = function(params) {
        var deferred = when.defer();
        var pageNo = params.pageNo || 1;
        var prePageNum = 2;
        var container = {
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
                keyword: "<",
                prefix: "a"
            },
            end_time: {
                keyword: ">",
                prefix: "a"
            },
            saler_name: {
                keyword: "like",
                sign: ["%", "%"],
                prefix: "a"
            },
            payment_begin_time: {
                keyword: ">",
                prefix: "p",
                mapsTo: 'payment_time'
            },
            payment_end_time: {
                keyword: "<",
                prefix: "p",
                mapsTo: 'payment_time'
            },
            create_begin_time: {
                keyword: ">",
                prefix: "p",
                mapsTo: 'create_time'
            },
            create_end_time: {
                keyword: "<",
                prefix: "p",
                mapsTo: 'create_time'
            },
            bank_id: "p",
            contract_status: "a",
            contract_type: "a",
            region_id: "b",
            province_id: "b",
            city_id: "b"
        }
        var strCondition = "", arrArgs = [];
        var arrLimit = [(pageNo - 1) * prePageNum, prePageNum];

        if(params.bank_id == -1) {
            delete params.bank_id;
        }

        // 过滤并获取查询字段,产出关联条件语句以及实参
        utils.ormFilter(params, arrOutput, function(str, arr) {
            strCondition = str ? " where " + str : "";
            arrArgs = arr;
        });
        var sql = "SELECT count(*) as contractCount FROM contract_info a right join contract_payment p on p.id = a.contract_number "
            + "JOIN contract_first_party b ON a.first_party_id = b.id "
            + "JOIN contract_second_party c ON a.second_party_id = c.id JOIN contract_type d ON "
            + "a.contract_type = d.id LEFT JOIN contract_invoice e ON a.contract_number = e.id LEFT JOIN contract_region f ON "
            + "b.region_id = f.id LEFT JOIN area h ON b.province_id = h.id LEFT JOIN area i ON b.city_id = i.id "
            + "left JOIN contract_bank j ON j.id = p.bank_id "
            + "left JOIN contract_user k ON k.id = p.user_id "
            + strCondition;

        db.driver.execQuery(sql, arrArgs, function (err, result) {
            if (!err) {
                container.count = result[0].contractCount;
                sql = "SELECT a.contract_number, b.first_party_name, c.second_party_name, d.contract_type_name,TIMESTAMPDIFF(DAY,DATE_FORMAT(a.end_time, '%Y-%m-%d'),NOW()) AS overdue_days,"
                    + "DATE_FORMAT(a.effective_time, '%Y-%m-%d') AS effective_time, DATE_FORMAT(a.end_time, '%Y-%m-%d') AS end_time,"
                    + "a.contract_price, a.deposit, a.paid_price, a.saler_name, a.contract_status,"
                    + "DATE_FORMAT(p.create_time, '%Y-%m-%d') AS create_time, f.region_name, h.area_name AS province_name, i.area_name AS city_name,"
                    + "p.id, j.bank_name, p.payment, date_format(p.payment_time, '%Y-%m-%d') as payment_time, k.user_name "
                    + "FROM contract_info a "
                    + "right JOIN contract_payment p ON p.id = a.contract_number "
                    + "JOIN contract_first_party b ON a.first_party_id = b.id "
                    + "JOIN contract_second_party c ON a.second_party_id = c.id "
                    + "JOIN contract_type d ON a.contract_type = d.id "
                    + "LEFT JOIN contract_region f ON b.region_id = f.id "
                    + "LEFT JOIN area h ON b.province_id = h.id "
                    + "LEFT JOIN area i ON b.city_id = i.id "
                    + "left JOIN contract_bank j ON j.id = p.bank_id "
                    + "left JOIN contract_user k ON k.id = p.user_id "
                    + strCondition + "  LIMIT ?,?";

                console.log(sql)
                db.driver.execQuery(sql, arrArgs.concat(arrLimit), function (err, list) {
                    if(!err) {
                        container.list = list;
                        container.totalPageNum = Math.ceil(container.count / prePageNum);
                        container.pagination = utils.paginationMath(pageNo, container.totalPageNum);

                        deferred.resolve(container);
                    }else
                        deferred.reject(err);
                })
            } else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    }
};
