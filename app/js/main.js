$(document).ready(function() {

    var checkUrlField           = $('#check_steamurl');
    var historyUrlField         = $('#history_steamurl');

    var checkBtn                = $('#check_btn');
    var historyBtn              = $('#history_btn');

    var dataErrorLbl1           = $('#data_error1 label');
    var dataErrorLbl2           = $('#data_error2 label');

    var checkPlayerInfoDiv      = $('#check_player_info');
    var historyPlayerInfoDiv    = $('#history_player_info');

    var checkTBoby              = $('#check_table tbody');
    var historyTBody            = $('#history_table tbody');

    /* Send request after press Enter */
    $('body').on('keypress', function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            var btn = $('.tab-content').find('.active.in').find('button');
            if (!btn.prop('disabled')) {
                btn.trigger('click');
            }
        }
    });


    checkBtn.on('click', function () {

        var steamUrl = $.trim(checkUrlField.val());

        disableElements(1, checkBtn, checkUrlField, checkPlayerInfoDiv, dataErrorLbl1);

        if (!validateUrl(steamUrl, dataErrorLbl1)) {
            enableElementsOnError(1, checkBtn, checkUrlField);
            return;
        }
        createProgressBar(1);

        setTimeout(function () {
            enableElementsOnError(1, checkBtn, checkUrlField);
        }, max_load_time);

        $.ajax({
            type: 'GET',
            
            url: site_url + 'steam_api/check?url=' + steamUrl,
            success: function(data) {

                enableElementsOnLoad(1, checkBtn, checkUrlField);

                if (data.info) {
                    showPlayerInfo(checkPlayerInfoDiv, data.info);
                }

                if (data.error) {
                    onDataError(dataErrorLbl1, data.error);
                }

                if (!data.snapshots) {
                    return;
                }

                $('#check_table').css('display', 'table');

                $.each(data.snapshots, function (index, snapshot) {
                    var deletedUrlsHtml = '';
                    $.each(snapshot.deleted_ids, function (index, id) {
                        deletedUrlsHtml +=
                            '<a ' +
                                'href="https://steamcommunity.com/profiles/' + id + '" target="_blank">' +
                                'https://steamcommunity.com/profiles/' + id +
                            '</a>' +  
                            '<br/>'    
                    });
                    if (!deletedUrlsHtml) {
                        deletedUrlsHtml = '___';
                    }
                    checkTBoby.append(
                        '<tr>' +
                            '<td>' + snapshot.checking_from + ' - </br>' + snapshot.checking_current + '</td>' +
                            '<td>' +
                                deletedUrlsHtml +
                            '</td>' +
                        '</tr>'
                    );
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                enableElementsOnLoad(1, checkBtn, checkUrlField);
                var error = JSON.parse(xhr.responseText).error;
                alert(getLocaleMessage(locale, 'ajax_error', [error.code, error.message]));
            }
        });
    });

    historyBtn.on('click', function () {

        var steamUrl = $.trim(historyUrlField.val());

        disableElements(2, historyBtn, historyUrlField, historyPlayerInfoDiv, dataErrorLbl2);

        if (!validateUrl(steamUrl, dataErrorLbl2)) {
            enableElementsOnError(2, historyBtn, historyUrlField);
            return;
        }
        createProgressBar(2);

        setTimeout(function () {
            enableElementsOnError(2, historyBtn, historyUrlField);
        }, max_load_time);

        $.ajax({
            type: 'GET',
            url: site_url + 'steam_api/history?url=' + steamUrl,
            success: function(data) {

                enableElementsOnLoad(2, historyBtn, historyUrlField);

                if (data.info) {
                    showPlayerInfo(historyPlayerInfoDiv, data.info);
                }

                if (data.error) {
                    onDataError(dataErrorLbl2, data.error);
                    return;
                }

                $('#history_table').css('display', 'table');

                fillAddingHistoryTable(data.friendlist);

                /* Add tooltips on links to show friends adding history */
                Tooltip.new('a.history_link');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                enableElementsOnLoad(2, historyBtn, historyUrlField);
                var error = JSON.parse(xhr.responseText).error;
                alert(getLocaleMessage(locale, 'ajax_error', [error.code, error.message]));
            }
        });
    });



    

    /* Validate steam profile url with regex */
    function validateUrl(url, lbl) {
        if (!url) {
            onDataError(lbl, getLocaleMessage(locale, 'empty_link', []));
            return false;
        }
        var steam_reg = /^(https?:\/\/)?(www\.)?steamcommunity\.com\/(id|profiles)\/[\w-]{1,128}\/?$/;
        if (steam_reg.test(url)) {
            return true;
        } else {
            onDataError(lbl, getLocaleMessage(locale, 'invalid_link', []));
            return false;
        }
    }


    /* Enable check button */
    function enableBtn(btn) {
        if (btn.prop('disabled')) {
            btn.prop('disabled', false);
        }
    }
    /* Disable check button */
    function disableBtn(btn) {
        if (!btn.prop('disabled')) {
            btn.prop('disabled', true);
        }
    }
    /* Enable input field */
    function enableInput(inp) {
        if (inp.prop('disabled')) {
            inp.prop('disabled', false);
        }
    }
    /* Disable input field */
    function disableInput(inp) {
        if (!inp.prop('disabled')) {
            inp.prop('disabled', true);
        }
    }

    /* Disable all needed elements after key pressing */
    function disableElements(num, btn, urlField, infoDiv, errorLbl) {
        switch (num) {
            case 1:
                checkTBoby.empty();
                $('#check_table').css('display', 'none');
                break;
            case 2:
                historyTBody.empty();
                $('#history_table').css('display', 'none');
                break;
            case 3:
                break;
        }
        disableBtn(btn);
        disableInput(urlField);
        clearPlayerInfo(infoDiv);
        hideDataError(errorLbl);
    }
    /* Enable all needed elements after unsuccess ajax request */
    function enableElementsOnError(num, btn, urlField) {
        toggleVisibleProgressBar(num, 'none');
        enableBtn(btn);
        enableInput(urlField);
    }

    /* Enable all needed elements after success ajax request */
    function enableElementsOnLoad(num, btn, urlField) {
        switch (num) {
            case 1:
                if (checkCircle) {
                    checkCircle.stop();
                    checkCircle.destroy();
                }
                break;
            case 2:
                if (historyCircle) {
                    historyCircle.stop();
                    historyCircle.destroy();
                }
                break;
            default:
                break;
        }
        toggleVisibleProgressBar(num, 'none');
        enableBtn(btn);
        enableInput(urlField);
    }

    /* Create new progressbar and start it */
    function createProgressBar(num) {
        removeSvg(num);
        toggleVisibleProgressBar(num, 'block');
        switch (num) {
            case 1:
                checkCircle = new ProgressBar.Circle('#progress_circle' + num, {
                    color: '#5FD5FA',
                    duration: max_load_time,
                    easing: 'linear',
                    strokeWidth: progress_stroke_width
                });
                checkCircle.animate(progress_circles_count);
                break;
            case 2:
                historyCircle = new ProgressBar.Circle('#progress_circle' + num, {
                    color: '#5FD5FA',
                    duration: max_load_time,
                    easing: 'linear',
                    strokeWidth: progress_stroke_width
                });
                historyCircle.animate(progress_circles_count);
                break;
            default:
                break;
        }
    }
    /* Show and hide progress bar */
    function toggleVisibleProgressBar(num, state) {
        var progress = $('#progress_circle' + num);
        if (progress.css('display') != state) {
            progress.css('display', state);
        }
    }

    /* Actions on data error */
    function onDataError(lbl, message) {
        var errDiv = lbl.parent();
        if (errDiv.css('display') != 'block') {
            errDiv.css('display', 'block');
        }
        lbl.html(message);
    }
    /* Hide data error message */
    function hideDataError(lbl, num) {
        var errDiv = lbl.parent();
        if (errDiv.css('display') != 'none') {
            errDiv.css('display', 'none');
        }
        lbl.html('');
    }

    /* Remove old svg-elements */
    function removeSvg(num) {
        var svgs = $('#progress_circle' + num + ' svg');
        if (svgs.length) {
            svgs.eq(0).remove();
        }
    }


    /* Clear and hide player info before ajax request */
    function clearPlayerInfo(infoDiv) {
        infoDiv.css('display', 'none');
        infoDiv.find('player_avatar').empty();
        infoDiv.find('player_data').empty();
    }
    /* Show player info in div after ajax request */
    function showPlayerInfo(playerInfoDiv, info) {
        var avatarDiv = playerInfoDiv.find('.player_avatar');
        var dataDiv = playerInfoDiv.find('.player_data');

        avatarDiv.html(
            '<a href="' + info.profileurl + '" target="_blank">' +
                '<img src="' + info.avatarmedium + '" alt="' + info.personaname + ' Steam Profile">' +
            '</a>'
        );

        var playerName = '<p><a href="' + info.permanentlink + '" target="_blank">' + info.personaname + '</a></p>';
        var createdAt = '';
        var lastLogout = '';
        var status = getLocaleMessage(locale, 'status', []) + ': ' + info.status;

        if (info.timecreated) {
            var accountCreated = getLocaleMessage(locale, 'account_created', [info.timecreated]);
            createdAt = '<p>' + accountCreated + '</p>';
        }
        if (info.isonline) {
            if (info.ingame) {
                status += ' <a href="' + info.gamelink + '" target="_blank">' + info.gamename + '</a>';
                if (info.serverip) {
                    status += ' (' + getLocaleMessage(locale, 'server_ip', []) + info.serverip + ')';
                }
            }
        } else {
            status += ', ' + getLocaleMessage(locale, 'last_logout', [info.lastlogoff]);
        }
        status = '<p>' + status + '</p>';
        dataDiv.html(playerName + createdAt + status + lastLogout);
        playerInfoDiv.css('display', 'block');
    }

    /* Fills history table after button press */
    function fillAddingHistoryTable(friendsData) {
        $.each(friendsData, function (index, friend) {

            var privateImg = '';
            if (friend.visibility != 3) {
                var privateImgTitle = getLocaleMessage(locale, 'private_img_title', []);
                privateImg =
                    '<img ' +
                        'class="img_private" ' +
                        'alt="" ' +
                        'title="' + privateImgTitle + '" ' +
                        'src="' + site_url + 'app/img/private.png" />';
            }

            var linkTitleMsg = getLocaleMessage(locale, 'history_link_title', [friend.personaname.substr(0, 30)]);

            historyTBody.append(
                '<tr>' +
                    '<td>' +
                        '<a href="' + friend.profileurl + '" target="_blank">' +
                            '<img ' +
                                'alt="" ' +
                                'src="' + friend.avatar + '"/>' +
                        '</a>' +
                    '</td>' +
                    '<td>' +
                        '<a ' +
                            'href="#" ' +
                            'data-title="' + linkTitleMsg + '" ' +
                            'class="history_link">' +
                                friend.personaname.substr(0, 30) +
                        '</a>' +
                        privateImg +
                    '</td>' +
                    '<td>' + friend.friend_since + '</td>' +
                '</tr>'
            );
        });
    }

    /* Substitude new profile url in input field and trigger button */
    $(document).on('click', 'a.history_link', function(e) {
        // Remove old tooltips
        $('.tooltip-container').remove();
        var profileUrl = $(e.target).parent().parent().first().find('td:first-child a').attr('href');
        historyUrlField.val(profileUrl);
        historyBtn.trigger('click');
    });

    /* Get user's browser locale */
    function getLocale() {
        if (navigator.language) {
            return navigator.language.substr(0, 2);
        } else {
            return 'en';
        }
    }

    /* Get localize message with arguments */
    function getLocaleMessage(locale, messageType, args) {
        switch (messageType) {
            case 'private_img_title':
                if (locale == 'ru') {
                    return 'Скрытый или доступный только для друзей профиль';
                } else {
                    return 'Private or Friends Only Profile';
                }
            case 'empty_link':
                if (locale == 'ru') {
                    return 'Пустая ссылка';
                } else {
                    return 'Empty Link';
                }
            case 'invalid_link':
                if (locale == 'ru') {
                    return 'Некорректная ссылка';
                } else {
                    return 'Invalid link';
                }
            case 'ajax_error':
                if (locale == 'ru') {
                    return 'Ошибка ' + args[0] + '\n' + args[1];
                } else {
                    return 'Error ' + args[0] + '\n' + args[1];
                }
            case 'history_link_title':
                if (locale == 'ru') {
                    return 'Показать историю добавления друзей игрока ' + args[0];
                } else {
                    return 'Show ' + args[0] + '\'s friends adding history';
                }
            case 'account_created':
                if (locale == 'ru') {
                    return 'Аккаунт создан: ' + args[0];
                } else {
                    return 'Account created: ' + args[0];
                }
            case 'last_logout':
                if (locale == 'ru') {
                    return 'последний выход из сети: ' + args[0];
                } else {
                    return 'last logout: ' + args[0];
                }
            case 'status':
                if (locale == 'ru') {
                    return 'Сейчас';
                } else {
                    return 'Now';
                }
            case 'server_ip':
                if (locale == 'ru') {
                    return 'сервер '
                } else {
                    return 'server '
                }
        }
    }

});
