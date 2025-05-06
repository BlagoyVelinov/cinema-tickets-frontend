$(function() {
    $(document).ready(function() {
        if (isMemberOnlySale) {
            $(document).unbind("click");
            $('.login-form').show();
            $('.selectTicket').hide();
            $('.login-link').hide();
            if (!isPostBack) {
                $.pgwModal({
                    content: msgMembersOnly
                });
            }
        }
        if (!jQuery.isEmptyObject(oSM)) {
            showSM(-1);
            $(".ddlTicketQuantity").each(function(index) {
                if (!$(this)[0].hasAttribute('onchange')) {
                    $(this).change(function() {
                        showSM(index);
                    })
                }
            });
        }
        if (mgq > 0)
            initGlasses();
        if ($('.total-tickets').length) {
            $(".ddlTicketQuantity").on('change', function() {
                calculateTotals();
            });
            calculateTotals();
        }
    });
    function initGlasses() {
        $('body').on('click', '.gsale input:radio', function() {
            var $grow = $(".grow");
            if ($(this).val() == "0") {
                $grow.hide("fast");
            } else {
                $grow.show("fast");
            }
        });
        var numCols = $("#TicketsSelection").find('tr')[0].cells.length;
        $('#TicketsSelection').find('tbody').append(['<tr class="trgsale">', '<td colspan=' + numCols + '>', '<div class="gsale">', '<div class=\"type-ticket\"><span id=\"lblTicketName\">' + glassesCaption + '</span></div>', '<div class="opty"><label for="optgn"><input type="radio" checked id="optgn" name="optg" value="0"/>' + glassesNo + '</label></div>', '<div class="opty"><label for="optgy"><input type="radio" id="optgy" name="optg" value="1"/>' + glassesYes + '</label></div>', '</div>', '</td>', '</tr>', '<tr  class="grow" style="display:none;">', '<td><div class="type-ticket">' + glassesSellableName + '</div></td>', '<td> <span id="lblPrice">' + glassesPrice + '</span></td>', '</td><td>', '<td><select id="ddlgq" name="ddlgq" class="ddlgq"></select></td>', '</td><td>', '</tr>'].join(''));
        for (i = 0; i <= mgq; i++) {
            $('#ddlgq').append($('<option>', {
                value: i,
                text: i
            }));
        }
        if (isglassesSelected == "1") {
            $("#optgy").click();
            $('#ddlgq option[value="' + gq + '"]').attr('selected', true);
        }
    }
    function showSM(srcInd) {
        $("#smcontainer").empty();
        var dicSM = new Object();
        $(".ddlTicketQuantity").each(function(xInd) {
            if ($(this).val() > 0) {
                $.each(oSM, function(key, value, index) {
                    if (value.clientId == xInd) {
                        if (!(value.messageId in dicSM)) {
                            dicSM[value.messageId] = value.message;
                        }
                        if (srcInd == index) {
                            $('html, body').animate({
                                scrollTop: $("#smcontainer").offset().top
                            }, 700);
                        }
                    }
                });
            }
        });
        for (var key in dicSM) {
            $("#smcontainer").append("<div class=\"ticketmsg\">" + dicSM[key] + "</div>");
        }
    }
    $("#lbSelectSeats").click(function() {
        var numOfTickets = 0;
        $(".selectTicket select.ddlTicketQuantity").each(function(index) {
            var iQty = parseInt($(this).val());
            numOfTickets += iQty
        });
        if (numOfTickets == 0) {
            showError(msgZeroSelection);
            return false;
        }
        if ($("#rblVaccinated").length) {
            var isChecked = $('#rblVaccinated input:checked').length > 0;
            if (!isChecked) {
                $("#reqVaccinated").show();
                return false;
            }
        }
        blockUI();
        return true;
    });
});
function calculateTotals() {
    var totalAmount = parseFloat(0);
    var originalAmount = parseFloat(0);
    var totalTickekQuantity = 0;
    $('.ticketTable > tbody  > tr').each(function(index, tr) {
        var $ddl = $(this).find('select.ddlTicketQuantity');
        var tickekQuantity = parseFloat($ddl.length ? $ddl.val() : 0);
        if (tickekQuantity > 0) {
            var ticketPrice = parseFloat($(this).attr('total-amount'));
            var ticketOriginalPrice = parseFloat($(this).attr('original-amount'));
            totalAmount += ticketPrice * tickekQuantity;
            originalAmount += ticketOriginalPrice * tickekQuantity;
            totalTickekQuantity += tickekQuantity;
        }
    });
    if (jsIsPlusLoggedIn) {
        var saving = parseFloat(originalAmount - totalAmount).toFixed(2);
        ;$('#member-totals .total-price').html(formatAmount(totalAmount));
        var $originalPrice = $('#member-totals .original-price');
        if (originalAmount == 0) {
            $originalPrice.css("text-decoarion", "line-through");
        } else {
            $originalPrice.css("text-decoarion", "none");
        }
        $originalPrice.html(originalAmount == 0 ? "&nbsp;" : formatAmount(originalAmount));
        $('#member-totals .saving').html(formatAmount(saving));
    } else {
        $('#nonmember-totals .total-price').html(formatAmount(totalAmount));
        $('#nonmember-totals .plus-price').html(formatAmount(originalAmount));
    }
    $('.total-tickets .quantity #tq').html(totalTickekQuantity);
    console.log(totalAmount);
    console.log(originalAmount);
}
function formatAmount(amount) {
    return amountPlaceHolder.replace("$amount", amount.toFixed(2));
}
