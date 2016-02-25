define(["jquery", "jquery-ui", "base", "transition", "dimmer", "modal", "popup", "dropdown", "tab"], function($, ui, base) {
	$(function() {
        var render = {
            invoiceList: function(arr, cb) {
                var strJoint = "";
                console.log(arr);
                arr = (typeof arr === "object"&& Object.prototype.toString.call(arr).toLowerCase() === "[object object]") ? [arr]: arr;

                arr.forEach(function(data) {
                    strJoint += "<tr class='center aligned'><td> " + data.invoice_number + "</td>"
                              + "<td>" + data.invoice_price + "</td>"
                              + "<td>" + data.invoice_time + "</td>"
                              + "<td>" + data.user_name + "</td>"
                              + "<td>" + data.create_time + "</td>"
                              + "</tr>";
                })

                cb(strJoint);
            },
            parties: function() {
                base.common.getData(base.api.parties, {}, false, function(parties) {
                    var firstParties, secondParties, timer = null;
                    var strTemp = "<option value=''>请选择</option>";
                    var strFirstParties = strTemp, strSecondParties = strTemp, i = 0, j = 0;

                    if(parties.status) {
                        firstParties = parties.data.firstParties;
                        secondParties = parties.data.secondParties;

                        for(; i < firstParties.length; i++) {
                            strFirstParties += "<option value='" + firstParties[i].id + "'>" + firstParties[i].first_party_name + "</option>";
                        }

                        for(; j < secondParties.length; j++) {
                            strSecondParties += "<option value='" + secondParties[j].id + "'>" + secondParties[j].second_party_name + "</option>";
                        }

                        $("#nFirstPartyDropdown").html(strFirstParties);
                        $("#nSecondPartyDropdown").html(strSecondParties);

                        // 设置初始值,用于合同修改
                        timer = setTimeout(function() {
                            $("#nFirstPartyDropdown").dropdown("set selected", $("#nFirstPartyDropdown").attr("data-origin-name"));
                            $("#nSecondPartyDropdown").dropdown("set selected", $("#nSecondPartyDropdown").attr("data-origin-name"));
                            $("#nContractTypeDropdown").dropdown("set selected", $("#nContractTypeDropdown").attr("data-origin-name"));

                            clearTimeout(timer);
                        }, 0);
                    }
                });
            },
            modalMsg: function(msg, selectorName) {       /** 控制弹出层的提示信息的显示与隐藏 **/
                var _msg = msg || "";

                if(_msg === "") {
                    if(!$("#" + selectorName).hasClass("hidden")) {
                        $("#" + selectorName).removeClass("hidden").transition("fade", function() {
                            $("#" + selectorName).find("span").html(_msg);
                        });
                    }
                }else {
                    $("#" + selectorName).find("span").html(_msg);
                    $("#" + selectorName).closest(".hidden").transition("fade");
                }
            }
        }

        var validate = {
            contractNumber: function(contractNumber) {
                if(contractNumber === "")
                    return {status: false, message: "请输入完整的合同编号"};
                else
                    return {status: true};
            },
            firstPartyId: function(firstPartyId) {
                if(firstPartyId === "")
                    return {status: false, message: "请选择甲方"};
                else
                    return {status: true};
            },
            secondPartyId: function(secondPartyId) {
                if(secondPartyId === "")
                    return {status: false, message: "请选择乙方"};
                else
                    return {status: true};
            },
            contractType: function(contractType) {
                if(contractType === "")
                    return {status: false, message: "请选择合同类型"};
                else
                    return {status: true};
            },
            contractTime: function(effectiveTime, endTime) {
                var _effectiveTime = new Date(effectiveTime).getTime();
                var _endTime = new Date(endTime).getTime();

                if(_effectiveTime.toString() === "NaN" || _endTime.toString() === "NaN")
                    return {status: false, message: "请选择合同生效截止日期"};
                else if(_effectiveTime > _endTime) {
                    return {status: false, message: "合同生效日期应小于截止日期"};
                }else {
                    return {status: true};
                }
            },
            contractPrice: function(contractPrice) {
                if(contractPrice === "" || contractPrice.toString().match(/^\d+(\.\d+)?$/g) === null)
                    return {status: false, message: "请输入正确的合同金额"};
                else
                    return {status: true};
            },
            deposit: function(deposit) {
                if(deposit === "" || deposit.toString().match(/^\d+(\.\d+)?$/g) === null)
                    return {status: false, message: "请输入正确的保证金金额"};
                else
                    return {status: true};
            },
            invoiceNumber: function(invoiceNumber) {
                if(invoiceNumber === "")
                    return {status: false, message: "请输入正确的发票编号"};
                else
                    return {status: true};
            },
            invoicePrice: function(invoicePrice) {
                if(invoicePrice === "" || invoicePrice.toString().match(/^\d+(\.\d+)?$/g) === null)
                    return {status: false, message: "请输入正确的发票金额"};
                else
                    return {status: true};
            },
            invoiceTime: function(invoiceTime) {
                if(invoiceTime === "")
                    return {status: false, message: "请选择开票时间"};
                else
                    return {status: true};
            }
        }

		$("#effectiveTime, #endTime, #nEffectiveTime, #nEndTime, #nInvoiceTime, #nCreateTime").datepicker({
			showButtonPanel: true,
			dateFormat: "yy-mm-dd"
		});

        /**
         * 打开修改合同窗口
         */
        $("#modifyBtn").on("click", function() {
            $("#contractModal").modal("setting", "transition", "fade down").modal("show");
        });

        /**
         * 修改合同
         */
        $("#confirmContractBtn").on("click", function() {
            var errMsg = "";
            var arrValidateItem = [];
            var params = {
                contractNumber: $("#nContractNumber").val(),
                firstPartyId: $("#nFirstPartyDropdown option:selected").val(),
                secondPartyId: $("#nSecondPartyDropdown option:selected").val(),
                contractType: $("#nContractTypeDropdown option:selected").val(),
                effectiveTime: $("#nEffectiveTime").val(),
                endTime: $("#nEndTime").val(),
                contractPrice: $("#nPrice").val(),
                deposit: $("#nDeposit").val()
            };

            arrValidateItem.push(validate.contractNumber(params.contractNumber));
            arrValidateItem.push(validate.firstPartyId(params.firstPartyId));
            arrValidateItem.push(validate.secondPartyId(params.secondPartyId));
            arrValidateItem.push(validate.contractType(params.contractType));
            arrValidateItem.push(validate.contractTime(params.effectiveTime, params.endTime));
            arrValidateItem.push(validate.contractPrice(params.contractPrice));
            arrValidateItem.push(validate.deposit(params.deposit));

            for(var i in arrValidateItem){
                if(arrValidateItem[i].status === false) {
                    errMsg = arrValidateItem[i].message;
                    break;
                }
            }

            if(errMsg === "") {
                $("#listLoader").addClass("active");
                base.common.postData(base.api.modifyContract, params, false, function(ret) {
                    if(ret.status) {
                        $('#contractModal').modal("setting", "transition", "fade down").modal("hide");
                        window.location.reload();
                    }else {
                        render.modalMsg(ret.message, "contractModalMsg");
                    }

                    $("#listLoader").removeClass("active");
                }, function() {});
            }else {
                render.modalMsg(errMsg, "contractModalMsg");
            }
        });

        /**
         * 选择大区
         */
        $("#regionDropdown").change(function() {
            var params = {
                region_id: $(this).val()
            }

            $('#provinceDropdown').dropdown('set text', "请选择省");
            $('#cityDropdown').dropdown('set text', "请选择市");

            base.common.getData(base.api.getProvince, params, false, function(resultData) {
                var i = 0;
                var oProvince = resultData.province;
                var strOptions = "<option value=''>请选择省</option>";


                for(; i < oProvince.length; i++) {
                    strOptions += "<option value='" + oProvince[i].area_id + "'>" + oProvince[i].province_name + "</option>";
                }

                $("#provinceDropdown").html(strOptions);
            }, function(err) {});
        });

        /**
         * 选择省份
         */
        $("#provinceDropdown").change(function() {
            var params = {
                area_id: $(this).val()
            }

            $('#cityDropdown').dropdown('set text', "请选择市");

            base.common.getData(base.api.getCity, params, false, function(resultData) {
                var i = 0;
                var oProvince = resultData.city;
                var strOptions = "<option value=''>请选择市</option>";


                for(; i < oProvince.length; i++) {
                    strOptions += "<option value='" + oProvince[i].id + "'>" + oProvince[i].city_name + "</option>";
                }

                $("#cityDropdown").html(strOptions);
            }, function(err) {});
        });

        /**
         * 审核合同
         */
        $("#verifyBtn").on("click", function() {
            var params = {
                contractNumber: $("#operationTab").attr("data-id")
            }

            base.common.postData(base.api.verifyContract, params, false, function(resultData) {
                if(resultData.status) {
                    window.location.reload();
                }else {
                    // 提示
                }
            }, function(err) {});
        });

        /**
         * Tab标签切换
         * 切换标签时获取新数据
         */
        $(".tabular a").on("click", function() {
            var currTabName = $(this).attr("data-tab");

            if($("#operationTab").attr("tab-name") !== currTabName) {
                var params;

                if(currTabName === "invoice") {
                    params = {
                        fuzzy: false,
                        contract_number: $("#operationTab").attr("data-id")
                    }

                    $("#invoiceListLoader").addClass("active");
                    base.common.getData(base.api.invoiceList, params, false, function(ret) {
                        render.invoiceList(ret.list, function(str) {
                            $("#invoiceList").html(str);
                        });

                        $("#invoiceListLoader").removeClass("active");
                    }, function() {});
                }

                $("#operationTab").attr("tab-name", currTabName);
            }
        });

        /**
         * 打开添加发票弹窗
         */
        $("#addInvoiceBtn").on("click", function() {
            $("#invoiceModal").modal("setting", "transition", "fade down").modal("show");
        });

        /**
         * 添加开票
         */
        $("#confirmInvoiceBtn").on("click", function() {
            var errMsg = "";
            var arrValidateItem = [];
            var params = {
                contractNumber: $("#operationTab").attr("data-id"),
                invoiceNumber: $("#nInvoiceNumber").val(),
                invoicePrice: $("#nInvoicePrice").val(),
                invoiceTime: $("#nInvoiceTime").val(),
            };

            arrValidateItem.push(validate.invoiceNumber(params.invoiceNumber));
            arrValidateItem.push(validate.invoicePrice(params.invoicePrice));
            arrValidateItem.push(validate.invoiceTime(params.invoiceTime));

            for(var i in arrValidateItem){
                if(arrValidateItem[i].status === false) {
                    errMsg = arrValidateItem[i].message;
                    break;
                }
            }

            if(errMsg === "") {
                $("#invoiceListLoader").addClass("active");
                base.common.postData(base.api.addInvoice, params, false, function(ret) {
                    if(ret.status) {
                        render.invoiceList(ret.data, function(str) {
                            $("#invoiceList").prepend(str);
                        });

                        $('#invoiceModal').modal("setting", "transition", "fade down").modal("hide");
                    }else {
                        render.modalMsg(ret.message, "invoiceModalMsg");
                    }

                    $("#invoiceListLoader").removeClass("active");
                }, function() {});
            }else {
                render.modalMsg(errMsg, "invoiceModalMsg");
            }
        });

        /**
         * 监听弹出层的关闭事件
         */
        $('#contractModal').modal("setting", "onHide", function() {
            render.modalMsg(null, "contractModalMsg");
        });

        render.parties();
	});
});