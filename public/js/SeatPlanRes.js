var sp;
function processSelectedSeats() {
    var authenticationCode = getCaptchaValue();
    var selectedSeats = $("#tbSelectedSeats").val();
    var pageToken = $("#hfVenueAndSectionId").val();
    var numOfSelectedSeats = sp.SelectedSeatsCount();
    if (numOfSelectedSeats == 0) {
        showError(msgNoSelection);
        return;
    }
    if (numOfSelectedSeats < minTicketQty) {
        showError(msgMinimumNotMet);
        return;
    }
    var res = validateCaptcha(processSelectedSeats);
    if (!res.IsValid) {
        if (res.IsShowError) {
            showError(requiredCaptcha);
            return;
        }
        return;
    }
    var data = {
        seats: selectedSeats,
        token: pageToken,
        auth: authenticationCode
    };
    $.ajax({
        url: "SelectSeatPageRes.aspx/SetSelectedSeats?ec=" + eventCode,
        type: "POST",
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        error: function(request, status, error) {
            alert(request.responseText);
        },
        beforeSend: function() {
            blockUI();
        },
        complete: function() {
            resetCaptcha();
        },
        success: function(msg) {
            var res = JSON.parse(msg.d);
            if (res.ReturnCode != 0) {
                $.unblockUI();
                if (res.Message != null && res.Message.length > 0) {
                    if (IsAccessibilityOn())
                        alert(res.Message);
                    else
                        showError(res.Message);
                }
                if (res.Redirect != null && res.Redirect.length > 0) {
                    document.location = res.Redirect;
                }
            } else {
                SetCookie(cookieIdentity, selectedSeats, serverSideMinuteExpire);
                document.location = res.Redirect;
            }
        }
    });
}
$(document).ready(function() {
    $('a.cancelBtn').click(function() {
        blockUI();
        document.location = backUrl;
        return false;
    });
    $(window).on('beforeunload', function() {});
    $("#btnNext").click(function() {
        processSelectedSeats();
    });
    $('.accessoptionscontainer :checkbox').change(function() {
        if (this.checked) {
            $(".buttons").hide();
            $("#SeatPlanContainer").hide();
            $("#accesibleSeatPlanContainer").show();
        } else {
            $(".buttons").show();
            $("#SeatPlanContainer").show();
            $("#accesibleSeatPlanContainer").hide();
        }
    });
    preSelectedSeats = $.cookie(cookieIdentity);
    sp = new TitanSeatPlan({
        seats: seats,
        canvasId: "myCanvas",
        pazoomContainerId: "panzoom-parent",
        containerId: "SeatPlanContainer",
        assetsPath: imagesFolderPath,
        seatsCounterContainerId: "seatsCounterDisplay",
        ycoordinateForTooCloseToScreenWarning: ycoordinateForCloseToScreenWarning,
        msgTooCloseToScreenWarning: msgFirstRowSaleConfirmation,
        maxTicketQty: maxTicketQty,
        minTicketQty: minTicketQty,
        msgLoveSeatWithCompanionNeeded: msgLoveSeatWithCompanionNeeded,
        msgLoveSeatBlocked: msgLoveSeatBlocked,
        msgLoveSeatNeeded: msgLoveSeatNeeded,
        msgLoveSeatHasCompanion: msgLoveSeatHasCompanion,
        loveSeatPolicy: loveSeatPolicy,
        loveSeatWCompPolicy: loveSeatWCompPolicy,
        loveSeatCompPolicy: loveSeatCompPolicy,
        doubleSeatPolicy: doubleSeatPolicy,
        selectTicketsPageURL: SelectTicketsPageLink,
        overMaxTicketSelectionPolicy: strOverMaxTicketSelectionPolicy,
        hasLoveSeats: hasLoveSeats,
        availLoveSeats: availLoveSeats,
        availLoveSeatsWithComp: availLoveSeatsWithComp,
        divSeatsCostTotalId: "divSeatsCostTotal",
        serviceChargePrice: serviceChargePrice,
        ticketPrice: ticketPrice,
        storeSelectedSeatsFieldId: "tbSelectedSeats",
        msgHandicap: msgHandicap,
        msgDiffTicketGroup: msgDiffTicketGroup,
        msgPartialObstruction: msgPartialObstruction,
        maximumMetChangeQuantity: maximumMetChangeQuantity,
        msgMaximumMet: msgMaximumMet,
        handicapSeatMode: handicapSeatMode,
        preSelectedSeats: preSelectedSeats,
        rowNameColor: rowNameColor,
        msgPremiumSeat: msgPerimumSeat,
        msgSeatAriaLabel: msgSeatAriaLabel,
        msgHandicapAriaLabel: msgHandicapAriaLabel,
        msgConfirmDifferentTicketGroupSeats: msgConfirmDifferentTicketGroupSeats,
        seatSize: seatSize,
        selectedSeatsModified: function(c) {
            if (c >= maxTicketQty) {
                $(".seatplan #seatselection").html(msgAllSeatsSelected);
                $(".seatplan #seatselection").removeClass("required");
            } else {
                $(".seatplan #seatselection").html(msgSelectSeats);
                $(".seatplan #seatselection").addClass("required");
            }
        }
    });
    sp.InitSeatPlan();
    InitAccessibility();
});
var mc;
function throttle(callback, limit) {
    var wait = false;
    return function() {
        if (!wait) {
            callback.call();
            wait = true;
            setTimeout(function() {
                wait = false;
            }, limit);
        }
    }
}
function TitanSeatPlan(options) {
    var defaults = {
        canvasId: 0,
        seats: [],
        pazoomContainerId: 0,
        containerId: 0,
        ycoordinateForTooCloseToScreenWarning: 5,
        msgTooCloseToScreenWarning: "TooCloseToScreenWarning",
        assetsPath: "Assets/",
        seatsCounterContainerId: 0,
        maxTicketQty: 0,
        minTicketQty: 0,
        msgLoveSeatWithCompanionNeeded: 'Please start your seating selection by selecting a Love Seat and an adjacent companion seat.',
        msgLoveSeatBlocked: 'A Love Seat sits two. You cannot select a Love Seat.',
        msgLoveSeatNeeded: 'Please use Love Seats for your seating selection.',
        msgLoveSeatHasCompanion: 'Selected Love Seat has an available companion seat. Please select a Love Seat with no companion seat to begin your seating selection.',
        loveSeatPolicy: 2,
        loveSeatWCompPolicy: 2,
        loveSeatCompPolicy: 2,
        doubleSeatPolicy: 1,
        selectTicketsPageURL: "SelectTicketsPageRes.aspx",
        overMaxTicketSelectionPolicy: 1,
        hasLoveSeats: false,
        availLoveSeats: 0,
        availLoveSeatsWithComp: 0,
        divSeatsCostTotalId: "divSeatsCostTotal",
        serviceChargePrice: 0,
        ticketPrice: 0,
        storeSelectedSeatsFieldId: "tbSelectedSeats",
        msgHandicap: "msgHanicap",
        msgDiffTicketGroup: "msgDiffTicketGroup",
        msgPartialObstruction: "msgPartialObstruction",
        maximumMetChangeQuantity: "You already selected {0} seat(s), If you would like to change your ticket quantity selection please click the OK button.",
        msgMaximumMet: "You already selected {0} seat(s).",
        handicapSeatMode: 0,
        preSelectedSeats: "",
        msgPremiumSeat: "Premium Seat",
        selectedSeatsModified: null,
        rowNameColor: "#000000",
        seatSize: 25
    }
    var settings = $.extend({}, defaults, options);
    var SeatStatus = {
        Available: 1,
        Unavailable: 2,
        Selected: 3,
        Blocked: 4
    };
    var SeatAttribute = {
        HandicapSpace: 10,
        CompanionSeat: 11,
        LoveSeatLeft: 5,
        LoveSeatRight: 6,
        DoubleSeatLeft: 18,
        DoubleSeatRight: 19,
        SeatPlanMessage: 100,
        SeatPlanVerticalMessage: 101
    };
    this.seats = settings.seats;
    this.Settings = settings;
    this.SeatStatuses = SeatStatus;
    this.SeatAttributes = SeatAttribute;
    var canvasId = settings.canvasId;
    var pazoomContainerId = settings.pazoomContainerId;
    var containerId = settings.containerId;
    var initialScale = 1;
    var canvas;
    var canvasContainer;
    var screenWidth;
    var screenHeight;
    var orgWindowWidth;
    var isConfirmedFirstRowsSelection = false;
    var seatSize = settings.seatSize;
    if ($('#' + canvasId).length == 0) {
        alert("canvas undifined:" + canvasId);
        return;
    }
    canvas = $('#' + canvasId);
    var mc = new Hammer(canvas[0]);
    mc.on("tap press", function(e) {
        if (e.type == "tap")
            mc.off("press");
        throttle(HandleTapClick(e), 1000);
    });
    function HandleTapClick(e) {
        var x, y;
        var rect = myCanvas.getBoundingClientRect();
        var top = rect.top;
        var bottom = rect.bottom;
        var left = rect.left;
        var right = rect.right;
        x = e.center.x - left;
        y = e.center.y - top;
        var width = right - left;
        if (e.target.width != width) {
            var height = bottom - top;
            x = x * (e.target.width / width);
            y = y * (e.target.height / height);
        }
        for (var i = 0; i < seats.length; i++) {
            var seat = seats[i];
            var seatLeft, seatTop, seatHeight, seatWidth;
            seatLeft = seat.left;
            seatTop = seat.top;
            seatHeight = seat.height;
            seatWidth = seat.width;
            if (x > seatLeft && x < (seatLeft + seatWidth) && y > seatTop && y < (seatTop + seatHeight)) {
                HandleClick(seat);
            }
        }
        return false;
    }
    this.InitSeatPlan = function() {
        $(function() {
            Init();
        });
    }
    function SetpreSelectedSeats() {
        var y, x, c;
        if (preSelectedSeats != null && preSelectedSeats.length > 0) {
            c = 0;
            var seatsArr = preSelectedSeats.split("#");
            for (var i = 0; i < seatsArr.length; i++) {
                if (c < settings.maxTicketQty) {
                    if (seatsArr[i].indexOf(",") > -1) {
                        y = seatsArr[i].split(",")[0];
                        x = seatsArr[i].split(",")[1];
                        var seat = GetSeatByCoord(x, y);
                        if (seat.status == SeatStatus.Available)
                            HandleClick(seat, false, true);
                        c++;
                    }
                }
            }
        }
        if (IsAccessibilityEnabled())
            updateAccessibilityTable();
    }
    function ClearSelectedSeats() {
        for (var i = 0; i < seats.length; i++) {
            if (seats[i].status == SeatStatus.Selected) {
                HandleClick(seats[i], false, false);
            }
        }
    }
    var Init = function() {
        orgWindowWidth = jQuery(window).width();
        if ($('#' + containerId).length == 0) {
            alert("containerId undifined:" + containerId);
            return;
        }
        UpdateSeatCounter();
        ctx = document.getElementById(canvasId).getContext("2d");
        if ($("#" + pazoomContainerId).length == 0) {
            alert("pazoomContainerId undifined:" + pazoomContainerId);
            return;
        }
        pazoomContainer = $("#" + pazoomContainerId);
        ctx.canvas.height = GetMaxPositionY() + 10;
        ctx.canvas.width = GetMaxPositionX();
        drawCanvas(seats);
        SetpreSelectedSeats();
        screenHeight = jQuery(window).height() * 0.99;
        screenWidth = Math.min(pazoomContainer.width(), jQuery(window).width()) * 0.99;
        if (screenHeight > $("#" + canvasId).height())
            pazoomContainer.height($("#" + canvasId).height());
        else
            pazoomContainer.height(screenHeight);
        if (screenWidth > $("#" + canvasId).width())
            pazoomContainer.width($("#" + canvasId).width());
        else
            pazoomContainer.width(screenWidth);
        var widthScale = parseFloat(($("#" + pazoomContainerId).width() / $("#" + canvasId).width()).toFixed(2));
        var heightScale = parseFloat(($("#" + pazoomContainerId).height() / $("#" + canvasId).height()).toFixed(2));
        initialScale = Math.min(widthScale, heightScale);
        var isVertical = $("#" + canvasId).width() < $("#" + canvasId).height();
        if (initialScale >= 1)
            initialScale = 1;
        else {
            if (pazoomContainer.width() > ($("#" + canvasId).width() * initialScale))
                pazoomContainer.width(Math.ceil($("#" + canvasId).width() * initialScale));
            if (pazoomContainer.height() > ($("#" + canvasId).height() * initialScale) && !isVertical)
                pazoomContainer.height(Math.ceil($("#" + canvasId).height() * initialScale));
        }
        $("#" + canvasId).panzoom("destroy");
        $panzoom = $("#" + canvasId).panzoom({
            $zoomIn: $(".zoom-in"),
            $zoomOut: $(".zoom-out"),
            $zoomRange: $(".zoom-range"),
            $reset: $(".reset"),
            startTransform: 'scale(1.0)',
            increment: 0.3,
            minScale: 1,
            maxScale: 3,
            contain: 'invert',
            cursor: 'pointer'
        }).panzoom("zoom", 1, {
            silent: false
        });
        $("#" + canvasId).panzoom("enable");
        function testEnd(e, panzoom, matrix, changed) {}
        $panzoom.panzoom('option', 'onEnd', testEnd);
    }
    this.HandleClickExt = function(seat) {
        return HandleClick(seat);
    }
    function HandleClick(seat, isLoveSeats, isPreSelected, isConfirmedHandiap) {
        isPreSelected = isPreSelected || false;
        isConfirmedHandiap = isConfirmedHandiap || false;
        if (!isPreSelected && hasAtt(seat, "pr=1")) {
            $.pgwModal({
                content: settings.msgPremiumSeat
            });
            return;
        }
        if (seat.status == SeatStatus.Blocked || seat.status == SeatStatus.Unavailable || (seat.DTG == 1 && isPreSelected))
            return;
        if (seat.y < settings.ycoordinateForTooCloseToScreenWarning && isConfirmedFirstRowsSelection == false && seat.status == SeatStatus.Available && !isPreSelected) {
            var isInIframe = window.location !== window.parent.location;
            if (isInIframe) {
                if (!confirm(settings.msgTooCloseToScreenWarning)) {
                    return;
                }
                isConfirmedFirstRowsSelection = true;
            } else {
                $.pgwModal({
                    target: '#tooclosecontainer',
                    closable: false,
                    titleBar: false,
                    maxWidth: 400
                });
                $(".tooclose .cancelBtn").click(function(e) {
                    e.preventDefault();
                    $.pgwModal('close');
                });
                $(".tooclose .actionBtn").click(function(e) {
                    e.preventDefault();
                    $.pgwModal('close');
                    isConfirmedFirstRowsSelection = true;
                    HandleClick(seat, isLoveSeats, isPreSelected);
                });
                return;
            }
        }
        if (seat.att == SeatAttribute.HandicapSpace && seat.status == SeatStatus.Available && !isPreSelected && !isConfirmedHandiap) {
            switch (settings.handicapSeatMode) {
                case "1":
                    showError(settings.msgHandicap);
                    return;
                default:
                    $(".confirmationModal span").html(settings.msgHandicap);
                    $.pgwModal({
                        target: '#confirmationModalContainer',
                        closable: false,
                        titleBar: false,
                        maxWidth: 400
                    });
                    $(".confirmationModal .cancelBtn").click(function(e) {
                        $.pgwModal('close');
                        return;
                    });
                    $(".confirmationModal .actionBtn").click(function(e) {
                        HandleClick(seat, isLoveSeats, isPreSelected, true);
                        $.pgwModal('close');
                    });
                    return;
                    if (!confirm(settings.msgHandicap))
                        return;
            }
        }
        if (seat.status == SeatStatus.Available && seat.PA == 1) {
            if (!confirm(settings.msgPartialObstruction))
                return;
        }
        if (seat.status == SeatStatus.Available && seat.DTG == 1) {
            $(".confirmationModal span").html(settings.msgConfirmDifferentTicketGroupSeats);
            $.pgwModal({
                target: '#confirmationModalContainer',
                closable: false,
                titleBar: false,
                maxWidth: 400
            });
            $(".confirmationModal .cancelBtn").click(function(e) {
                e.preventDefault();
                $.pgwModal('close');
            });
            $(".confirmationModal .actionBtn").click({
                tgid: seat.tgid
            }, function(e) {
                e.preventDefault();
                $("#ddlAdditionalTicketGroupsInSection").val(e.data.tgid).change();
                $.pgwModal('close');
                if ($("#ddlAdditionalTicketGroupsInSection").length) {
                    blockUI();
                }
            });
            return;
            $(".confirmationModal .actionBtn").click({
                id: 10,
                name: "João"
            }, function(e) {
                e.preventDefault();
                $.pgwModal('close');
                alert(event.data.name);
            });
            return;
        }
        var y, x;
        y = seat.y;
        x = seat.x;
        isLoveSeats = isLoveSeats || false;
        var seatSelectedCount = CountSelectedSeats();
        if (seat.status == SeatStatus.Selected) {
            seat.status = SeatStatus.Available;
            if (!isLoveSeats) {
                if (hasAtt(seat, "LS=L")) {
                    HandleClick(GetSeatByCoord(x + 1, y), true);
                    if (hasAtt(seat, "LC=R") && GetSeatByCoord(x + 2, y).status == SeatStatus.Selected) {
                        HandleClick(GetSeatByCoord(x + 2, y), true);
                    } else if (hasAtt(seat, "LC=L") && GetSeatByCoord(x - 1, y).status == SeatStatus.Selected) {
                        HandleClick(GetSeatByCoord(x - 1, y), true);
                    }
                } else if (hasAtt(seat, "LS=R")) {
                    HandleClick(GetSeatByCoord(x - 1, y), true);
                    if (hasAtt(seat, "LC=R") && GetSeatByCoord(x + 1, y).status == SeatStatus.Selected) {
                        HandleClick(GetSeatByCoord(x + 1, y), true);
                    } else if (hasAtt(seat, "LC=L") && GetSeatByCoord(x - 2, y).status == SeatStatus.Selected) {
                        HandleClick(GetSeatByCoord(x - 2, y), true);
                    }
                }
                if (hasAtt(seat, "LC=1")) {
                    if (hasAtt(seat, "LO=L") && GetSeatByCoord(x - 1, y).status == SeatStatus.Selected && GetSeatByCoord(x - 2, y).status == SeatStatus.Selected) {
                        HandleClick(GetSeatByCoord(x - 1, y), true);
                        HandleClick(GetSeatByCoord(x - 2, y), true);
                    } else if (hasAtt(seat, "LO=R") && GetSeatByCoord(x + 1, y).status == SeatStatus.Selected && GetSeatByCoord(x + 2, y).status == SeatStatus.Selected) {
                        HandleClick(GetSeatByCoord(x + 1, y), true);
                        HandleClick(GetSeatByCoord(x + 2, y), true);
                    }
                }
            }
            drawSeat(seat);
            HandleClickCompleted();
            return;
        }
        if (seatSelectedCount == settings.maxTicketQty) {
            var con;
            if (settings.overMaxTicketSelectionPolicy == 1) {
                showError(settings.msgMaximumMet.replace("{0}", settings.maxTicketQty));
                return;
            } else {
                ClearSelectedSeats();
            }
        }
        if (seat.status == SeatStatus.Available) {
            if (!isPreSelected && settings.hasLoveSeats && !isLoveSeats) {
                var leftDelta = 0
                    , rightDelta = 0;
                if (hasAtt(seat, "LS=R")) {
                    rightDelta = 0;
                    leftDelta = -1;
                } else if (hasAtt(seat, "LS=L")) {
                    rightDelta = 1;
                    leftDelta = 0;
                }
                if (((settings.maxTicketQty - seatSelectedCount) % 2 == 1) && availLoveSeatsWithComp > 0 && (hasAtt(seat, "LC=") || (hasAtt(seat, "LC=L") && GetSeatByCoord(y, x - 1 + leftDelta).status == SeatStatus.Unavailable) || (hasAtt(seat, "LC=R") && GetSeatByCoord(x + 1 + rightDelta, y).status == SeatStatus.Unavailable) || (hasAtt(seat, "LC=B") && GetSeatByCoord(x - 1 + leftDelta, y).status == 2 && GetSeatByCoord(x + 1 + rightDelta, y).status == SeatStatus.Unavailable))) {
                    showError(msgLoveSeatWithCompanionNeeded);
                    return;
                }
                if (hasAtt(seat, "LC=1")) {
                    if ((maxTicketQty - seatSelectedCount) % 2 == 0 && (maxTicketQty - seatSelectedCount) <= availLoveSeats) {
                        showError(msgLoveSeatNeeded);
                        return;
                    } else {
                        if (hasAtt(seat, "LO=L") && GetSeatByCoord(x - 1, y).status == SeatStatus.Available && GetSeatByCoord(x - 2, y).status == SeatStatus.Available) {
                            HandleClick(GetSeatByCoord(x - 1, y), true);
                            HandleClick(GetSeatByCoord(x - 2, y), true);
                        } else if (hasAtt(seat, "LO=R") && GetSeatByCoord(x + 1, y) == SeatStatus.Available && GetSeatByCoord(x + 2, y).status == SeatStatus.Available) {
                            HandleClick(GetSeatByCoord(x + 1, y), true);
                            HandleClick(GetSeatByCoord(x + 2, y), true);
                        }
                    }
                }
                if (hasAtt(seat, "LS=")) {
                    if (maxTicketQty - seatSelectedCount < 2) {
                        showError(msgLoveSeatBlocked);
                        return;
                    }
                    if (((maxTicketQty - seatSelectedCount) % 2 == 1) && availLoveSeatsWithComp > 0 && (!hasAtt(seat, "LC=") || (hasAtt(seat, "LC=L") && GetSeatByCoord(x - 1 + leftDelta, y).status == SeatStatus.Unavailable) || (hasAtt(seat, "LC=R") && GetSeatByCoord(x + 1 + rightDelta, y).status == SeatStatus.Unavailable) || (hasAtt(seat, "LC=B") && GetSeatByCoord(x - 1 + leftDelta, y).status == SeatStatus.Unavailable && GetSeatByCoord(x + 1 + rightDelta, y).status == SeatStatus.Unavailable))) {
                        showError(msgLoveSeatWithCompanionNeeded);
                        return;
                    }
                    if ((maxTicketQty - seatSelectedCount) % 2 == 1) {
                        if (hasAtt(seat, "LC=L") && GetSeatByCoord(x - 1 + leftDelta, y).status == SeatStatus.Available) {
                            HandleClick(GetSeatByCoord(x - 1 + leftDelta, y), true);
                        }
                        if (hasAtt(seat, "LC=R") && GetSeatByCoord(x + 1 + rightDelta, y).status == SeatStatus.Available) {
                            HandleClick(GetSeatByCoord(x + 1 + rightDelta, y), true);
                        }
                    }
                    if (hasAtt(seat, "LS=L")) {
                        HandleClick(GetSeatByCoord(x + 1, y), true);
                    } else if (hasAtt(seat, "LS=R")) {
                        HandleClick(GetSeatByCoord(x - 1, y), true);
                    }
                }
            }
            seat.status = SeatStatus.Selected;
            drawSeat(seat);
            HandleClickCompleted();
            return;
        }
    }
    function HandleClickCompleted() {
        UpdateSeatCounter();
        var seatSelectedCount = CountSelectedSeats();
        if (settings.selectedSeatsModified && typeof (settings.selectedSeatsModified) === "function") {
            settings.selectedSeatsModified(seatSelectedCount);
        }
    }
    function hasAtt(seat, att) {
        return seat.addAtt.indexOf(att) > -1;
    }
    this.HasAtt = function(seat, att) {
        return hasAtt(seat, att);
    }
    function GetAttValue(seat, attName) {
        if (seat.addAtt.length == 0)
            return "";
        var attstr = seat.addAtt;
        for (i = 0; i < seat.addAtt.split(",").length; i++) {
            if (seat.addAtt.split(",")[i].split("=")[0].toLowerCase() == attName.toLowerCase()) {
                if (seat.addAtt.split(",")[i].split("=").length > 1)
                    return seat.addAtt.split(",")[i].split("=")[1];
            }
        }
        return "";
    }
    function GetSeatByCoord(x, y) {
        for (i = 0; i < seats.length; i++) {
            if (seats[i].x == x && seats[i].y == y)
                return seats[i];
        }
        return null;
    }
    function GetMaxPositionX() {
        var xPos = 0;
        for (x = 0; x < seats.length; x++) {
            if (seats[x].left > xPos)
                xPos = seats[x].left;
        }
        return xPos + seats[0].width;
    }
    function GetMaxPositionY() {
        var yPos = 0;
        for (x = 0; x < seats.length; x++) {
            if (seats[x].top > yPos)
                yPos = seats[x].top;
        }
        return yPos + seats[0].height;
    }
    function drawCanvas(seats) {
        for (x = 0; x < seats.length; x++) {
            drawSeat(seats[x]);
        }
    }
    function drawSeat(seat) {
        var base_image = new Image();
        var imageAtt = GetAttValue(seat, "SI");
        var blnPrintSeatName = true;
        switch (seat.att) {
            case 0:
                switch (seat.status) {
                    case SeatStatus.Available:
                        base_image.src = settings.assetsPath + "SeatAvailable" + imageAtt + ".png";
                        break;
                    case SeatStatus.Selected:
                        base_image.src = settings.assetsPath + "SeatSelected" + imageAtt + ".png";
                        break;
                    case SeatStatus.Unavailable:
                        if (hasAtt(seat, "pr=1")) {
                            base_image.src = settings.assetsPath + "PremiumSeatSelected" + imageAtt + ".png";
                        } else {
                            base_image.src = settings.assetsPath + "SeatUnavailable" + imageAtt + ".png";
                        }
                        break;
                    default:
                        base_image.src = settings.assetsPath + "SeatUnavailable" + imageAtt + ".png";
                        break;
                }
                break;
            case SeatAttribute.HandicapSpace:
                blnPrintSeatName = false;
                switch (seat.status) {
                    case SeatStatus.Available:
                        base_image.src = settings.assetsPath + "HandicapSeatAvailable.png";
                        break;
                    case SeatStatus.Selected:
                        base_image.src = settings.assetsPath + "HandicapSeatSelected.png";
                        break;
                    case SeatStatus.Unavailable:
                        base_image.src = settings.assetsPath + "HandicapSeatUnavailable.png";
                        break;
                    default:
                        base_image.src = settings.assetsPath + "HandicapSeatUnavailable.png";
                }
                break;
            case SeatAttribute.CompanionSeat:
                blnPrintSeatName = false;
                switch (seat.status) {
                    case SeatStatus.Available:
                        base_image.src = settings.assetsPath + "CompanionSeatAvailable.png";
                        break;
                    case SeatStatus.Selected:
                        base_image.src = settings.assetsPath + "CompanionSeatSelected.png";
                        break;
                    case SeatStatus.Unavailable:
                        base_image.src = settings.assetsPath + "CompanionSeatUnavailable.png";
                        break;
                    default:
                        base_image.src = settings.assetsPath + "CompanionSeatUnavailable.png";
                }
                break;
            case SeatAttribute.LoveSeatLeft:
            case sp.SeatAttributes.DoubleSeatLeft:
                switch (seat.status) {
                    case SeatStatus.Available:
                        base_image.src = seat.DTG ? settings.assetsPath + "LoveSeatLeftDiffTG.png" : settings.assetsPath + "LoveSeatLeftAvail" + imageAtt + ".png";
                        break;
                    case SeatStatus.Selected:
                        base_image.src = settings.assetsPath + "LoveSeatLeftSelected" + imageAtt + ".png";
                        break;
                    case SeatStatus.Unavailable:
                        base_image.src = settings.assetsPath + "LoveSeatLeftUnAvail" + imageAtt + ".png";
                        break;
                    default:
                        base_image.src = settings.assetsPath + "LoveSeatLeftUnAvail" + imageAtt + ".png";
                }
                break;
            case SeatAttribute.LoveSeatRight:
            case sp.SeatAttributes.DoubleSeatRight:
                switch (seat.status) {
                    case SeatStatus.Available:
                        base_image.src = seat.DTG ? settings.assetsPath + "LoveSeatRightDiffTG.png" : settings.assetsPath + "LoveSeatRightAvail" + imageAtt + ".png";
                        break;
                    case SeatStatus.Selected:
                        base_image.src = settings.assetsPath + "LoveSeatRightSelected" + imageAtt + ".png";
                        break;
                    case SeatStatus.Unavailable:
                        base_image.src = settings.assetsPath + "LoveSeatRightUnAvail" + imageAtt + ".png";
                        break;
                    default:
                        base_image.src = settings.assetsPath + "LoveSeatRightUnAvail" + imageAtt + ".png";
                }
                break;
            default:
                base_image.src = settings.assetsPath + "SeatUnavailable" + imageAtt + ".png";
                break
        }
        var xFactor = 10, Yfactor = 16, fontSize, fontColor, fontName, tgColor;
        fontSize = GetAttValue(seat, "fontSize");
        fontName = GetAttValue(seat, "fontName");
        fontColor = GetAttValue(seat, "fontColor");
        if (fontSize.length == 0)
            fontSize = 11;
        if (fontName.length == 0)
            fontName = "arial";
        if (fontColor.length == 0)
            fontColor = "#000000";
        var seatSizeFactor = settings.seatSize / 25;
        if (seat.sn.length > 1) {
            xFactor = 6,
                Yfactor = 16;
        }
        if (settings.seatSize == 50) {
            xFactor = 20;
            Yfactor = 32;
            if (seat.att == SeatAttribute.DoubleSeatLeft)
                xFactor += 10;
            if (seat.att == SeatAttribute.DoubleSeatRight)
                xFactor -= 10;
        }
        if (seat.rn == 1) {
            if (seat.att == SeatAttribute.SeatPlanMessage) {
                ctx.save();
                ctx.translate(0, 0);
                ctx.rotate(Math.PI / 2);
                ctx.font = fontSize + "px " + fontName;
                ctx.fillStyle = fontColor;
                ctx.textAlign = "left";
                ctx.fillText(seat.sn, seat.top, (seat.left * -1));
                ctx.restore();
            } else if (seat.att == SeatAttribute.SeatPlanVerticalMessage) {
                blnPrintSeatName = false;
                ctx.font = fontSize + "px " + fontName;
                ctx.fillStyle = fontColor;
                ctx.fillText(seat.sn, seat.left, seat.top);
            } else {
                blnPrintSeatName = false;
                ctx.font = "11px arial";
                ctx.fillStyle = settings.rowNameColor;
                ctx.fillText(seat.sn, seat.left + xFactor, seat.top + Yfactor);
            }
        } else {
            if (seat.DTG && seat.status == SeatStatus.Available && seat.att != sp.SeatAttributes.DoubleSeatRight && seat.att != sp.SeatAttributes.LoveSeatLeft && seat.att != sp.SeatAttributes.LoveSeatRight && seat.att != sp.SeatAttributes.DoubleSeatLeft) {
                var tgColor = GetAttValue(seat, "c");
                if (tgColor == "")
                    tgColor = "000000";
                ctx.fillStyle = "#" + tgColor;
                ctx.fillRect(seat.left, seat.top, 23, 23);
            } else {
                base_image.onload = function() {
                    ctx.drawImage(base_image, seat.left, seat.top, settings.seatSize, settings.seatSize);
                    if (blnPrintSeatName) {
                        ctx.fillStyle = "#fff";
                        ctx.font = "10px arial";
                        ctx.fillText(seat.sn, seat.left + xFactor, seat.top + Yfactor);
                    }
                }
            }
        }
    }
    function UpdateSeatCounter() {
        var seatSelectedCount = CountSelectedSeats();
        $("#" + settings.divSeatsCostTotalId).html((seatSelectedCount * (settings.ticketPrice + settings.serviceChargePrice)).toFixed(2));
        StoreSelectedSeats();
        if ($("#" + settings.seatsCounterContainerId).length == 0) {
            return;
        }
        $("#" + settings.seatsCounterContainerId).html(CountSelectedSeats());
    }
    this.SelectedSeatsCount = function() {
        return CountSelectedSeats();
    }
    this.getMaxY = function() {
        var y = -1;
        for (var i = 0; i < seats.length; i++) {
            if (seats[i].y > y)
                y = seats[i].y;
        }
        return y;
    }
    this.getMaxX = function() {
        var x = -1;
        for (var i = 0; i < seats.length; i++) {
            if (seats[i].x > x)
                x = seats[i].x;
        }
        return x;
    }
    this.GetSeats = function() {
        return seats;
    }
    this.GetSeatByCoord = function(x, y) {
        return GetSeatByCoord(x, y);
    }
    function CountSelectedSeats() {
        var c = 0;
        for (i = 0; i < seats.length; i++) {
            if (seats[i].status == SeatStatus.Selected)
                c++;
        }
        return c;
    }
    function StoreSelectedSeats() {
        var newVal = "";
        for (i = 0; i < seats.length; i++) {
            if (seats[i].status == SeatStatus.Selected) {
                if (newVal.length > 0)
                    newVal = newVal + "#";
                newVal = newVal + seats[i].y + "," + seats[i].x;
            }
        }
        $('#' + settings.storeSelectedSeatsFieldId).val(newVal);
    }
    function resizedw() {
        if (orgWindowWidth == jQuery(window).width())
            return;
        orgWindowWidth = jQuery(window).width();
        $("#panzoom-parent").width($("#SeatPlanContainer").width());
        $("#myCanvas").panzoom('resetDimensions');
        $("#myCanvas").panzoom("resetPan");
        $("#myCanvas").panzoom("resetZoom");
        Init();
    }
    var timeoutHandler;
    window.onresize = function() {
        clearTimeout(timeoutHandler);
        timeoutHandler = setTimeout(resizedw, 300);
    }
    ;
}
function IsAccessibilityEnabled() {
    return $(".tableSP").length > 0;
}
function IsAccessibilityOn() {
    return $('input.chkAccess').is(':checked')
}
function InitAccessibility() {
    if (IsAccessibilityEnabled()) {
        drawAccessibilityTable();
        updateAccessibilityTable();
    }
    $(".aseat").click(function(e) {
        e.preventDefault();
        var x, y
        x = $(this).attr("id").split("_")[1];
        y = $(this).attr("id").split("_")[2];
        var seat = sp.GetSeatByCoord(x, y);
        sp.HandleClickExt(seat);
        updateAccessibilityTable();
    });
}
function drawAccessibilityTable() {
    var $t = $(".tableSP");
    var innerHTML = "", tmpRow, isBlankRow;
    var tabIndex = 1000;
    var rowNumber = 0;
    var incRow = false;
    for (var y = 1; y <= sp.getMaxY(); y++) {
        isBlankRow = true;
        tmpRow = "<tr>";
        incRow = true;
        for (var x = 1; x <= sp.getMaxX(); x++) {
            var s = sp.GetSeatByCoord(x, y);
            if (s != null) {
                if (incRow) {
                    rowNumber++;
                    incRow = false;
                }
                rowName = s.rn;
                tmpRow += createSeatTd(s, tabIndex, rowNumber);
                isBlankRow = false;
                tabIndex++;
            } else
                tmpRow += createEmptyTdPlaceHolder(x, y);
        }
        if (!isBlankRow)
            innerHTML += tmpRow;
    }
    $t.append(innerHTML);
    return;
}
function createSeatTd(s, tind, rowNumber) {
    var ariaLabel = sp.Settings.msgSeatAriaLabel.replace("$rowName", rowNumber).replace("$seatName", s.x);
    if (s.att == sp.SeatAttributes.HandicapSpace)
        ariaLabel = sp.Settings.msgHandicapAriaLabel.replace("$rowName", rowNumber).replace("$seatName", s.x);
    if (s.status == sp.SeatStatuses.Unavailable) {
        return '<td data-ind="td_' + s.y + '_' + s.x + '"><div tabindex=-1 role="checkbox" aria-checked="false" aria-label="' + ariaLabel + '" class="aseat" id="s_' + s.x + '_' + s.y + '"><div class="ds">' + s.sn + '</div></div></td>';
    }
    return '<td data-ind="td_' + s.y + '_' + s.x + '"><a href="void:0" tabindex=' + tind + ' role="checkbox" aria-checked="false" aria-label="' + ariaLabel + '" class="aseat" id="s_' + s.x + '_' + s.y + '"><div class="ds">' + s.sn + '</div></a></td>';
}
function createEmptyTdPlaceHolder(x, y) {
    return '<td data-ind="td_' + y + '_' + x + '"></td>';
}
function updateAccessibilityTable() {
    for (var i = 0; i < sp.GetSeats().length; i++) {
        var seat = seats[i];
        var seatLeft, seatTop, seatHeight, seatWidth, x, y, blnAddRow;
        seatLeft = seat.left;
        seatTop = seat.top;
        seatHeight = seat.height;
        seatWidth = seat.width;
        y = seat.y;
        x = seat.x;
        if (seat.y != 0) {
            updateAccessibleSeat(seat);
        }
    }
}
function updateAccessibleSeat(seat) {
    var base_image = new Image();
    var blnPrintSeatName = true;
    switch (seat.att) {
        case 0:
            switch (seat.status) {
                case sp.SeatStatuses.Available:
                    base_image.src = sp.Settings.assetsPath + "SeatAvailable.png";
                    break;
                case sp.SeatStatuses.Selected:
                    base_image.src = sp.Settings.assetsPath + "SeatSelected.png";
                    break;
                case sp.SeatStatuses.Unavailable:
                    if (sp.HasAtt(seat, "pr=1")) {
                        base_image.src = sp.Settings.assetsPath + "PremiumSeatSelected.png";
                    } else {
                        base_image.src = sp.Settings.assetsPath + "SeatUnavailable.png";
                    }
                    break;
                default:
                    base_image.src = sp.Settings.assetsPath + "SeatUnavailable.png";
                    break;
            }
            break;
        case sp.SeatAttributes.HandicapSpace:
            blnPrintSeatName = false;
            switch (seat.status) {
                case sp.SeatStatuses.Available:
                    base_image.src = sp.Settings.assetsPath + "HandicapSeatAvailable.png";
                    break;
                case sp.SeatStatuses.Selected:
                    base_image.src = sp.Settings.assetsPath + "HandicapSeatSelected.png";
                    break;
                case sp.SeatStatuses.Unavailable:
                    base_image.src = sp.Settings.assetsPath + "HandicapSeatUnavailable.png";
                    break;
                default:
                    base_image.src = sp.Settings.assetsPath + "HandicapSeatUnavailable.png";
            }
            break;
        case sp.SeatAttributes.CompanionSeat:
            blnPrintSeatName = false;
            switch (seat.status) {
                case sp.SeatStatuses.Available:
                    base_image.src = sp.Settings.assetsPath + "CompanionSeatAvailable.png";
                    break;
                case sp.SeatStatuses.Selected:
                    base_image.src = sp.Settings.assetsPath + "CompanionSeatSelected.png";
                    break;
                case sp.SeatStatuses.Settings:
                    base_image.src = sp.Settings.assetsPath + "CompanionSeatUnavailable.png";
                    break;
                default:
                    base_image.src = sp.Settings.assetsPath + "CompanionSeatUnavailable.png";
            }
            break;
        case sp.SeatAttributes.LoveSeatLeft:
            switch (seat.status) {
                case sp.SeatStatuses.Available:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatLeftAvail.png";
                    break;
                case sp.SeatStatuses.Selected:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatLeftSelected.png";
                    break;
                case sp.SeatStatuses.Unavailable:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatLeftUnAvail.png";
                    break;
                default:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatLeftUnAvail.png";
            }
            break;
        case sp.SeatAttributes.LoveSeatRight:
            switch (seat.status) {
                case sp.SeatStatuses.Available:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatRightAvail.png";
                    break;
                case sp.SeatStatuses.Selected:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatRightSelected.png";
                    break;
                case sp.SeatStatuses.Unavailable:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatRightUnAvail.png";
                    break;
                default:
                    base_image.src = sp.Settings.assetsPath + "LoveSeatRightUnAvail.png";
            }
            break;
        default:
            base_image.src = sp.Settings.assetsPath + "SeatUnavailable.png";
            break
    }
    if (seat.rn != 1) {
        base_image.onload = function() {
            var state;
            switch (seat.status) {
                case sp.SeatStatuses.Available:
                    state = "0";
                    break;
                case sp.SeatStatuses.Selected:
                    state = "1";
                    break;
                case sp.SeatStatuses.Unavailable:
                    state = "-1";
                    break;
                default:
                    state = "-1";
            }
            $("#s_" + seat.x + "_" + seat.y).attr("data-state", state);
            $("#s_" + seat.x + "_" + seat.y).attr("aria-checked", state == 1 ? "true" : "false");
            $("#s_" + seat.x + "_" + seat.y).css("background-image", "url(" + base_image.src + ")");
        }
    }
}
