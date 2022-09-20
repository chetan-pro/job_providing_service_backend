$(document).ready(function() {

    $('#pincode-text-field').on('input', function(dets) {
        var pincode = this.value;
        console.log("pincode length");
        console.log(pincode.length);
        if (pincode.length > 5) {

            $("#city-dropdown").html('');
            $.ajax({
                url: "/api/pin-code-details",
                type: "get",
                data: {
                    pin_code: pincode,
                },
                dataType: 'json',
                success: function(result) {
                    var stateName = result['data']['PostOffice'][0]['State'];
                    var cityName = result['data']['PostOffice'][0]['District'];
                    $.ajax({
                        url: "/api/state-list",
                        type: "get",
                        data: {},
                        dataType: 'json',
                        success: function(result) {
                            console.log(result);
                            var stateObj = result.data.rows.find((obj) => obj.name === stateName);
                            $('#state-dropdown').html(`<option value="${stateObj.id}">${stateObj.name}</option>`);
                            $.each(result.data.rows, function(key, value) {
                                $('#state-dropdown').append(`<option value="${value.id}">${value.name}</option>`);
                                // console.log(value)
                            });
                            $("#city-dropdown").html('');
                            $.ajax({
                                url: "/api/city-list",
                                type: "get",
                                data: {
                                    state_id: stateObj.id,
                                },
                                dataType: 'json',
                                success: function(result) {
                                    console.log(result);
                                    var cityObj = result.data.rows.find((obj) => obj.name === cityName);
                                    $('#city-dropdown').html(`<option value="${cityObj.id}">${cityObj.name}</option>`);
                                    $.each(result.data.rows, function(key, value) {
                                        $("#city-dropdown").append('<option value="' + value.id + '">' + value.name + '</option>');
                                        // console.log(value)
                                    });
                                }
                            });
                        }
                    });

                    // $.each(result.data.rows, function(key, value) {
                    //     $("#city-dropdown").append('<option value="' + value.id + '">' + value.name + '</option>');
                    //     // console.log(value)
                    // });
                }
            });
        }
    });

    $('#image-picker-input').on('change', function(dets) {
        for (let obj in this.files) {
            if (this.files[obj].name) {
                $('#imageBox').append(`<div style="margin-right:10px;border-radius:5px;width: 150px;height:150px;background-repeat:no-repeat;background-size:contain;background-position: center;background-color: grey;background-image:asset(${data.name
            });"> </div>`);
                console.log(this.files[obj].name);
            }
        }
        // this.files.forEach((data, index) => {

        // });
    });

    $('#state-dropdown').on('change', function(dets) {
        var state_id = this.value;
        // console.log(dets.target.value)
        $("#city-dropdown").html('');
        $.ajax({
            url: "/api/city-list",
            type: "get",
            data: {
                name: 'state',
                state_id: state_id,
            },
            dataType: 'json',
            success: function(result) {
                $('#city-dropdown').html('<option value="">Select City</option>');
                $.each(result.data.rows, function(key, value) {
                    $("#city-dropdown").append('<option value="' + value.id + '">' + value.name + '</option>');
                    // console.log(value)
                });
            }
        });
    });
    $('#industry-dropdown').on('change', function(dets) {
        var industry_id = this.value;
        // console.log(dets.target.value)
        $("#sector-dropdown").html('');
        $.ajax({
            url: "/api/sector-list",
            type: "get",
            data: {
                name: 'industry',
                industry_id: industry_id,
            },
            dataType: 'json',
            success: function(result) {
                $('#sector-dropdown').html('<option value="">Select Sector</option>');
                $.each(result.data.rows, function(key, value) {
                    $("#sector-dropdown").append('<option value="' + value.id + '">' + value.name + '</option>');
                    // console.log(value)
                });
            }
        });
    });

    const element = document.getElementsByClassName("card-body");
    // console.log(element.children)
    // let numb = element.children.length;

    // console.log(numb)

    console.log('input fields');
    var max_fields = 10; //maximum input boxes allowed
    var wrapper = $(".card-body"); //Fields wrapper
    var add_button = $(".add_field_button"); //Add button ID
    var x = 1; //initlal text box count
    $(add_button).click(function(e) { //on add input button click
        e.preventDefault();
        if (x < max_fields) { //max input box allowed
            x++; //text box increment
            $(wrapper).append(`
            <div class="row">
    <div class="col-md-5">
        <div class="form-group">
            <label> Enter Question </label>
            <input type="text" class="form-control" name="[questions][x]" placeholder="Enter Question" />
        </div>
    </div>
    <div class="col-md-4">
        <div class="form-group">
            <label> status </label>
            <select class="form-control select2bs4" style="width: 100%" id="state-dropdown" name="[status][x]">
        <option value="1" selected>Active</option>
        <option value="0">Inactive</option>
      </select>
        </div>
    </div>
    <div class="col-3">
        <button class="btn btn-sm btn-outline-danger remove_field" style="margin-top: 2rem">
      Remove field
    </button>
    </div>
</div>`);
            // add input box
        }
    });

    $(wrapper).on("click", ".remove_field", function(e) { //user click on remove text
        e.preventDefault();
        $(this).parent('div').parent('div').remove();
        x--;
    });

    // frontend Changes for Creation of subscription plans
    let selection = $("#offer-type-subscription,#job-limit-subscription,#description-limit-subscription,#plan-type-area-subscription,#plan-type-sub-area-subscription,#cv-limit-subscription,#connected-metro-plan-subscription,#connected-non-metro-plan-subscription,#email-limit-subscription,#job-boosting-subscription,#job-boosting-days-subscription");

    selection.hide();

    $('#user-role-type-subscription').on('change', function(dets) {
        if (dets.target.value === "COMPANY") {
            $("#offer-type-subscription,#job-limit-subscription,#description-limit-subscription,#plan-type-area-subscription,#plan-type-sub-area-subscription,#cv-limit-subscription,#connected-metro-plan-subscription,#connected-non-metro-plan-subscription,#email-limit-subscription,#job-boosting-subscription").show();
        } else {
            selection.hide();
        }
    });

    $('#job-boosting-subscription').on('change', function(dets) {
        dets.target.value != "N" ? $("#job-boosting-days-subscription").show() : $("#job-boosting-days-subscription").hide();
    });


    $("#otherContractType").hide();
    $("#durationContract").hide();

    $("#contract-type-job").on('change', function(val) {
        if (val.target.value === "other") {
            $("#durationContract").hide();
            $("#otherContractType").show();
        } else if (val.target.value === "contracted" || val.target.value === "intern") {
            $("#durationContract").show();
            $("#otherContractType").hide();
        } else {
            $("#durationContract").hide();
            $("#otherContractType").hide();

        }
    });
    $('#contract-type-job').trigger('change');
    $("#jobTime").hide();
    $("#jobSchedule").on('change', function(val) {
        console.log(val.target.value);
        if (val.target.value === '') {
            $("#jobTime").hide();
        } else {
            $("#jobTime").show();
        }
    });

    $("#experienceField").hide();
    $("#experienceRequired").on('change', function(val) {
        console.log(val.target.value);
        if (val.target.value === 'Y') {
            $("#experienceField").show();
        } else {
            $("#experienceField").hide();
        }
    });
    $("#educationOption").hide();
    $("#educationRequired").on('change', function(val) {
        console.log(val.target.value);
        if (val.target.value === 'Y') {
            $("#educationOption").show();
        } else {
            $("#educationOption").hide();
        }
    })

    $("#amountInRange").hide();
    $("#amountNotInRange").hide();
    $("#salaryType").on('change', function(val) {
        console.log(val.target.value);
        if (val.target.value === 'amount_in_range') {
            $("#amountInRange").show();
            $("#amountNotInRange").hide();
        } else if (val.target.value === '') {
            $("#amountInRange").hide();
            $("#amountNotInRange").hide();
        } else {
            $("#amountInRange").hide();
            $("#amountNotInRange").show();
        }
    });
    $(".mobileNumberField").keypress(function(e) {
        var length = jQuery(this).val().length;
        if (length > 9) {
            return false;
        } else if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
            return false;
        } else if ((length == 0) && (e.which == 48)) {
            return false;
        }
    });

    $(".pincodeNumberField").keypress(function(e) {
        var length = jQuery(this).val().length;
        if (length > 5) {
            return false;
        } else if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
            return false;
        } else if ((length == 0) && (e.which == 48)) {
            return false;
        }
    });

    $(".adharNumberField").keypress(function(e) {
        var length = jQuery(this).val().length;
        if (length > 11) {
            return false;
        } else if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
            return false;
        } else if ((length == 0) && (e.which == 48)) {
            return false;
        }
    });

    $(".panNumberField").keypress(function(e) {
        var length = jQuery(this).val().length;
        if (length > 9) {
            return false;
        }
    });




    let url = window.location.href.split('/');;
    url = url[url.length - 1];
    let result = $(a[href *= "/admin/${url}"])
    result.addClass("active");
    let parent = result.parent().parent().parent().get(0);
    let n = $(parent).find("a").get(0);
    $(n).addClass("active");
    $(parent).addClass("menu-open");
})