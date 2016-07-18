/* ----------------------------------------------------------------------------
 * Easy!Appointments - Open Source Web Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) 2013 - 2016, Alex Tselegidis
 * @license     http://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        http://easyappointments.org
 * @since       v1.2.0
 * ---------------------------------------------------------------------------- */

/**
 * Backend Calendar
 *
 * This module implements the table calendar view of backend.
 *
 * @module BackendCalendarTableView
 */
window.BackendCalendarTableView = window.BackendCalendarTableView || {};

(function(exports) {

    'use strict';

    function _bindEventHandlers() {
        var $calendarToolbar = $('#calendar-toolbar'); 
        var $calendar = $('#calendar'); 

        $calendar.on('click', '.calendar-header .btn.previous', function() {
            var endDate = new Date($('#calendar .date-column:first').data('date')).add({days: -1}); 
            var startDate = new Date(endDate.getTime()).add({days: -1 * (parseInt($('#select-filter-item').val()) - 1)});
            _createView(startDate, endDate);
        });

        $calendar.on('click', '.calendar-header .btn.next', function() {
            var startDate = new Date($('#calendar .date-column:last').data('date')).add({days: 1}); 
            var endDate = new Date(startDate.getTime()).add({days: parseInt($('#select-filter-item').val()) - 1}); 
            _createView(startDate, endDate);
        });

        $calendarToolbar.on('change', '#select-filter-item', function() {
            var startDate = new Date($('.calendar-view .date-column:first').data('date')); 
            var endDate = new Date(startDate.getTime()).add({days: parseInt($(this).val()) - 1}); 
            _createView(startDate, endDate);
        });

        $calendarToolbar.on('click', '#reload-appointments', function() {
            var startDate = new Date($('.calendar-view .date-column:first').data('date'));
            var endDate = new Date($('.calendar-view .date-column:last').data('date'));
            _createView(startDate, endDate);
        }); 
        
        $calendar.on('click', '.calendar-view table td', function() {
            if ($(this).index() === 0) {
                return; // Clicked on an hour slot. 
            }

            // Open the appointments modal in the selected hour. 
            var hour = $(this).parent().find('td:first').text().split(':'); 
            var date = new Date($(this).parents('.date-column').data('date'));
            date.set({hour: parseInt(hour[0]), minute: parseInt(hour[1])});

            // Open the appointments dialog. 
            $('#insert-appointment').trigger('click');

            // Update start date field.
            $('#start-datetime').datepicker('setDate', date); 

            // Select Service and provider. 
            var $providerColumn = $(this).parents('.provider-column');
            var serviceId = $providerColumn.find('thead tr:last th').eq($(this).index()).data('id');
            var providerId = $providerColumn.data('provider').id; 
            $('#select-service').val(serviceId).trigger('change');
            $('#select-provider').val(providerId).trigger('change');
        }); 

        var lastFocusedEventData;
        $calendar.on('click', '.event', function(event) {
            event.stopPropagation(); 

            $('.popover').remove(); // Close all open popovers.

            var html;
            var entry = $(this).data(); 

            if ($(this).hasClass('unavailability')) {                
                var notes = '<strong>Notes</strong> ' + entry.notes;

                html =
                        '<style type="text/css">'
                            + '.popover-content strong {min-width: 80px; display:inline-block;}'
                            + '.popover-content button {margin-right: 10px;}'
                            + '</style>' +
                        '<strong>' + EALang['start'] + '</strong> '
                            + GeneralFunctions.formatDate(entry.start_datetime, GlobalVariables.dateFormat, true)
                            + '<br>' +
                        '<strong>' + EALang['end'] + '</strong> '
                            + GeneralFunctions.formatDate(entry.end_datetime, GlobalVariables.dateFormat, true)
                            + '<br>'
                            + notes
                            + '<hr>' +
                        '<center>' +
                            '<button class="edit-popover btn btn-primary">' + EALang['edit'] + '</button>' +
                            '<button class="delete-popover btn btn-danger">' + EALang['delete'] + '</button>' +
                            '<button class="close-popover btn btn-default" data-po=' + event.target + '>' + EALang['close'] + '</button>' +
                        '</center>';
            } else {
                html =
                        '<style type="text/css">'
                            + '.popover-content strong {min-width: 80px; display:inline-block;}'
                            + '.popover-content button {margin-right: 10px;}'
                            + '</style>' +
                        '<strong>' + EALang['start'] + '</strong> '
                            + GeneralFunctions.formatDate(entry.start_datetime, GlobalVariables.dateFormat, true)
                            + '<br>' +
                        '<strong>' + EALang['end'] + '</strong> '
                            + GeneralFunctions.formatDate(entry.end_datetime, GlobalVariables.dateFormat, true)
                            + '<br>' +
                        '<strong>' + EALang['service'] + '</strong> '
                            + entry.service.name
                            + '<br>' +
                        '<strong>' + EALang['provider'] + '</strong> '
                            + entry.provider.first_name + ' '
                            + entry.provider.last_name
                            + '<br>' +
                        '<strong>' + EALang['customer'] + '</strong> '
                            + entry.customer.first_name + ' '
                            + entry.customer.last_name
                            + '<hr>' +
                        '<center>' +
                            '<button class="edit-popover btn btn-primary">' + EALang['edit'] + '</button>' +
                            '<button class="delete-popover btn btn-danger">' + EALang['delete'] + '</button>' +
                            '<button class="close-popover btn btn-default" data-po=' + event.target + '>' + EALang['close'] + '</button>' +
                        '</center>';
            }

            $(event.target).popover({
                placement: 'top',
                title: entry.service.name + ' - ' + entry.customer.first_name + ' ' + entry.customer.last_name,
                content: html,
                html: true,
                container: '#calendar',
                trigger: 'manual'
            });

            lastFocusedEventData = entry;
            $(event.target).popover('toggle');

            // Fix popover position
            if ($('.popover').length > 0) {
                if ($('.popover').position().top < 200) $('.popover').css('top', '200px');
            }
        });

        $(window).on('resize', _setCalendarSize);

        /**
         * Event: Popover Close Button "Click"
         *
         * Hides the open popover element.
         */
        $calendar.on('click', '.close-popover', function() {
            $(this).parents().eq(2).popover('destroy');
        });

        /**
         * Event: Popover Edit Button "Click"
         *
         * Enables the edit dialog of the selected calendar event.
         */
        $calendar.on('click', '.edit-popover', function() {
            $(this).parents().eq(2).popover('destroy'); // Hide the popover

            var $dialog;

            if (lastFocusedEventData.is_unavailable == false) {
                var appointment = lastFocusedEventData;
                $dialog = $('#manage-appointment');

                BackendCalendarAppointmentsModal.resetAppointmentDialog();

                // Apply appointment data and show modal dialog.
                $dialog.find('.modal-header h3').text(EALang['edit_appointment_title']);
                $dialog.find('#appointment-id').val(appointment['id']);
                $dialog.find('#select-service').val(appointment['id_services']).trigger('change');
                $dialog.find('#select-provider').val(appointment['id_users_provider']);

                // Set the start and end datetime of the appointment.
                var startDatetime = Date.parseExact(appointment['start_datetime'],
                        'yyyy-MM-dd HH:mm:ss');
                $dialog.find('#start-datetime').datetimepicker('setDate', startDatetime);

                var endDatetime = Date.parseExact(appointment['end_datetime'],
                        'yyyy-MM-dd HH:mm:ss');
                $dialog.find('#end-datetime').datetimepicker('setDate', endDatetime);

                var customer = appointment['customer'];
                $dialog.find('#customer-id').val(appointment['id_users_customer']);
                $dialog.find('#first-name').val(customer['first_name']);
                $dialog.find('#last-name').val(customer['last_name']);
                $dialog.find('#email').val(customer['email']);
                $dialog.find('#phone-number').val(customer['phone_number']);
                $dialog.find('#address').val(customer['address']);
                $dialog.find('#city').val(customer['city']);
                $dialog.find('#zip-code').val(customer['zip_code']);
                $dialog.find('#appointment-notes').val(appointment['notes']);
                $dialog.find('#customer-notes').val(customer['notes']);
            } else {
                var unavailable = lastFocusedEventData.data;

                // Replace string date values with actual date objects.
                unavailable.start_datetime = GeneralFunctions.clone(lastFocusedEventData.start_datetime);
                unavailable.end_datetime = GeneralFunctions.clone(lastFocusedEventData.end_datetime);

                $dialog = $('#manage-unavailable');
                BackendCalendarUnavailbilities.resetUnavailableDialog();

                // Apply unvailable data to dialog.
                $dialog.find('.modal-header h3').text('Edit Unavailable Period');
                $dialog.find('#unavailable-start').datetimepicker('setDate', unavailable.start_datetime);
                $dialog.find('#unavailable-id').val(unavailable.id);
                $dialog.find('#unavailable-end').datetimepicker('setDate', unavailable.end_datetime);
                $dialog.find('#unavailable-notes').val(unavailable.notes);
            }

            // :: DISPLAY EDIT DIALOG
            $dialog.modal('show');
        });

        /**
         * Event: Popover Delete Button "Click"
         *
         * Displays a prompt on whether the user wants the appoinmtent to be deleted. If he confirms the
         * deletion then an ajax call is made to the server and deletes the appointment from the database.
         */
        $calendar.on('click', '.delete-popover', function() {
            $(this).parents().eq(2).popover('destroy'); // Hide the popover

            if (lastFocusedEventData.is_unavailable == false) {
                var messageButtons = {};
                messageButtons['OK'] = function() {
                    var postUrl = GlobalVariables.baseUrl + '/index.php/backend_api/ajax_delete_appointment';
                    var postData = {
                        csrfToken: GlobalVariables.csrfToken,
                        appointment_id : lastFocusedEventData['id'],
                        delete_reason: $('#delete-reason').val()
                    };

                    $.post(postUrl, postData, function(response) {
                        $('#message_box').dialog('close');

                        if (response.exceptions) {
                            response.exceptions = GeneralFunctions.parseExceptions(response.exceptions);
                            GeneralFunctions.displayMessageBox(GeneralFunctions.EXCEPTIONS_TITLE,
                                    GeneralFunctions.EXCEPTIONS_MESSAGE);
                            $('#message_box').append(GeneralFunctions.exceptionsToHtml(response.exceptions));
                            return;
                        }

                        if (response.warnings) {
                            response.warnings = GeneralFunctions.parseExceptions(response.warnings);
                            GeneralFunctions.displayMessageBox(GeneralFunctions.WARNINGS_TITLE,
                                    GeneralFunctions.WARNINGS_MESSAGE);
                            $('#message_box').append(GeneralFunctions.exceptionsToHtml(response.warnings));
                        }

                        // Refresh calendar event items.
                        $('#select-filter-item').trigger('change');
                    }, 'json').fail(GeneralFunctions.ajaxFailureHandler);
                };

                messageButtons[EALang['cancel']] = function() {
                    $('#message_box').dialog('close');
                };

                GeneralFunctions.displayMessageBox(EALang['delete_appointment_title'],
                        EALang['write_appointment_removal_reason'], messageButtons);

                $('#message_box').append('<textarea id="delete-reason" rows="3"></textarea>');
                $('#delete-reason').css('width', '100%');
            } else {
                // Do not display confirmation promt.
                var postUrl = GlobalVariables.baseUrl + '/index.php/backend_api/ajax_delete_unavailable';
                var postData = {
                    csrfToken: GlobalVariables.csrfToken,
                    unavailable_id : lastFocusedEventData.id
                };

                $.post(postUrl, postData, function(response) {
                    $('#message_box').dialog('close');

                    if (response.exceptions) {
                        response.exceptions = GeneralFunctions.parseExceptions(response.exceptions);
                        GeneralFunctions.displayMessageBox(GeneralFunctions.EXCEPTIONS_TITLE, GeneralFunctions.EXCEPTIONS_MESSAGE);
                        $('#message_box').append(GeneralFunctions.exceptionsToHtml(response.exceptions));
                        return;
                    }

                    if (response.warnings) {
                        response.warnings = GeneralFunctions.parseExceptions(response.warnings);
                        GeneralFunctions.displayMessageBox(GeneralFunctions.WARNINGS_TITLE, GeneralFunctions.WARNINGS_MESSAGE);
                        $('#message_box').append(GeneralFunctions.exceptionsToHtml(response.warnings));
                    }

                    // Refresh calendar event items.
                    $('#select-filter-item').trigger('change');
                }, 'json').fail(GeneralFunctions.ajaxFailureHandler);
            }
        });
    }

    function _createHeader() {
        var $calendarFilter = $('#calendar-filter'); 

        $calendarFilter
            .find('select')
            .empty()
            .append(new Option('1 ' + EALang['day'] , 1))
            .append(new Option('4 ' + EALang['days'], 4));
        
        var $calendarHeader = $('<div class="calendar-header" />').appendTo('#calendar'); 

        $calendarHeader
            .html(
                '<button class="btn btn-xs btn-default previous">' +
                    '<span class="glyphicon glyphicon-chevron-left"></span>' +
                '</button>' +
                '<button class="btn btn-xs btn-default next">' +
                    '<span class="glyphicon glyphicon-chevron-right"></span>' +
                '</button>'
            );
    }

    /**
     * Create table schedule view. 
     *
     * This method will destroy any previous instances and create a new view for displaying the appointments in 
     * a table format. 
     * 
     * @param {Date} startDate Start date to be displayed.
     * @param {Date} endDate End date to be displayed. 
     */
    function _createView(startDate, endDate) {
        $('#calendar .calendar-view').remove();

        var $calendarView = $('<div class="calendar-view" />').appendTo('#calendar'); 

        $calendarView.data({
            startDate: startDate.toString('yyyy-MM-dd'),
            endDate: endDate.toString('yyyy-MM-dd')
        });

        var $wrapper = $('<div />').appendTo($calendarView);

        _getCalendarEvents(startDate, endDate)
            .done(function(response) {
                if (!GeneralFunctions.handleAjaxExceptions(response)) {
                    return;
                }

                var currentDate = startDate; 

                while(currentDate <= endDate) {
                    _createDateColumn($wrapper, currentDate, response); 
                    currentDate.add({days: 1}); 
                }

                _setCalendarSize();
            })
            .fail(GeneralFunctions.ajaxFailureHandler);
    }

    function _createDateColumn($wrapper, date, events) {
        var $dateColumn = $('<div class="date-column" />').appendTo($wrapper); 

        $dateColumn
            .data('date', date.getTime())
            .append('<h5>' + GeneralFunctions.formatDate(date, GlobalVariables.dateFormat) + '</h5>');

        for (var index in GlobalVariables.availableProviders) {
            var provider = GlobalVariables.availableProviders[index]; 
            _createProviderColumn($dateColumn, date, provider, events);
        }
    }

    function _createProviderColumn($dateColumn, date, provider, events) {
        var $providerColumn = $('<div class="provider-column" />').appendTo($dateColumn); 

        $providerColumn.data('provider', provider); 

        // Create the table slots. 
        _createSlots($providerColumn, date, provider); 

        // Add the appointments to the column. 
        _createAppointments($providerColumn, events.appointments); 
        
        // Add the unavailabilities to the column. 
        _createUnavailabilities($providerColumn, events.unavailabilities); 
    }

    function _createSlots($providerColumn, date, provider) {
        var day = date.toString('dddd').toLowerCase(); 
        var plan = JSON.parse(provider.settings.working_plan)[day]; 

        if (!plan) {
            $providerColumn.append('<div class="not-working">' 
                    + (provider.first_name + ' ' + provider.last_name).trim() +' <br> ' + EALang['not_working'] 
                    + '</div>');
            return;
        }

        var $table = $('<table class="slots" />')
            .appendTo($providerColumn)
            .addClass('table table-condensed table-responsive table-hover table-striped')
            .html(
                '<thead>' +
                    '<tr>' +
                        '<th colspan="' + (provider.services.length + 1) + '">' + 
                            (provider.first_name + ' ' + provider.last_name).trim() + 
                        '</th>' +
                    '</tr>' + 
                    '<tr>' +
                        '<th>' + EALang['time'] + '</th>' +
                    '</tr>' + 
                '</thead>' +
                '<tbody></tbody>'
            );

        for (var index in GlobalVariables.availableServices) {
            var service = GlobalVariables.availableServices[index]; 

            if (provider.services.indexOf(service.id) > -1) {
                $table.find('thead tr:last').append('<th data-id="' + service.id + '">' + service.name + '</th>'); 
            }
        }

        var start = parseInt(plan.start.split(':')[0]); 
        var end = parseInt(plan.end.split(':')[0]) + 1;
        var current = start;
        var $tbody = $table.find('tbody'); 

        while(current <= end) {
            var $tr = $('<tr/>').appendTo($tbody); 

            var time = (current < 10 ? '0' + parseInt(current) : parseInt(current)) + (current % 1 === 0 ? ':00' : ':30'); 

            $tr
                .append('<td>' + time + '</td>')
                .append('<td/>'.repeat(provider.services.length)); 

            current += 0.5; 
        }
    }

    function _createAppointments($providerColumn, appointments) {
        if (appointments.length === 0) {
            return;
        }

        var currentDate = new Date($providerColumn.parents('.date-column').data('date')); 
        var $tbody = $providerColumn.find('table tbody');

        for (var index in appointments) {
            var appointment = appointments[index]; 

            if (appointment.id_users_provider !== $providerColumn.data('provider').id) {
                continue;
            }

            var eventDate = Date.parse(appointment.start_datetime); 
            var $event = $('<div class="event appointment" />'); 

            $event.html(
                appointment.service.name + ' - ' + 
                (appointment.customer.first_name + ' ' + appointment.customer.last_name).trim()
            );

            $event.data(appointment);

            $tbody.find('tr').each(function(index, tr) {
                var $td = $(tr).find('td:first'); 

                var cellDate = new Date(currentDate.getTime()).set({
                    hour: parseInt($td.text().split(':')[0]),
                    minute: parseInt($td.text().split(':')[1])
                }); 

                if (eventDate < cellDate) {
                    var cellIndex = $providerColumn
                        .find('thead tr:last th[data-id="' + appointment.service.id + '"]')
                        .index();

                    $event.appendTo($(tr).prev().find('td').eq(cellIndex));
                    return false;
                }
            }); 
        }
    }

    function _createUnavailabilities($providerColumn, unavailabilities) {
        if (unavailabilities.length === 0) {
            return;
        }

        var currentDate = new Date($providerColumn.parents('.date-column').data('date')); 
        var $tbody = $providerColumn.find('table tbody');

        for (var index in unavailabilities) {
            var unavailability = unavailabilities[index]; 

            if (unavailability.id_users_provider !== $providerColumn.data('provider').id) {
                continue;
            }

            var eventDate = Date.parse(unavailability.start_datetime); 
            var $event = $('<div class="event unavailability" />'); 

            $event.html(unavailability.notes || EALang['unavailable']);

            $event.data(unavailability);

            $tbody.find('tr').each(function(index, tr) {
                var $td = $(tr).find('td:first'); 

                var cellDate = new Date(currentDate.getTime()).set({
                    hour: parseInt($td.text().split(':')[0]),
                    minute: parseInt($td.text().split(':')[1])
                }); 

                if (eventDate < cellDate) {
                    $event.appendTo($(tr).prev().find('td').eq(1));
                    return false;
                }
            }); 
        }
    }

    function _setCalendarSize() {
        var height = window.innerHeight - $('#header').outerHeight() - $('#footer').outerHeight() 
                - $('#calendar-toolbar').outerHeight() - $('.calendar-header').outerHeight() - 50;
        $('.calendar-view').height(height); 

        $('.calendar-view > div').css('min-width', '1000%');
        var width = 0; 

        $('.date-column').each(function(index, dateColumn) {
            width += $(dateColumn).outerWidth();
        });

        $('.calendar-view > div').css('min-width', width + 50);

        $('.calendar-view .not-working').outerHeight(height - 70);

    }

    /**
     * Get the calendar events. 
     * 
     * @param {Date} startDate
     * @param {Date} endDate
     * 
     * @return {jQuery.jqXHR}
     */
    function _getCalendarEvents(startDate, endDate) {
        var url = GlobalVariables.baseUrl + '/index.php/backend_api/ajax_get_calendar_events'; 
        var data = {
            csrfToken: GlobalVariables.csrfToken,
            startDate: startDate.toString('yyyy-MM-dd'),
            endDate: endDate.toString('yyyy-MM-dd')
        };

        return $.post(url, data); 
    }

    exports.initialize = function() {
        _createHeader(); 
        _createView(Date.today(), Date.today().add({days: parseInt($('#select-filter-item').val() - 1)}));
        _bindEventHandlers();
    };

})(window.BackendCalendarTableView);