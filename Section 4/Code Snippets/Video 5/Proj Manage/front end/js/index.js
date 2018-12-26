$(document).ready(function () {
    
    //Global Variables/Constants

    var boardendpoint = 'https://xavmne8l95.execute-api.us-east-2.amazonaws.com/dev/boards';

    var cardendpoint = 'https://sdku9x12zl.execute-api.us-east-2.amazonaws.com/dev/cards'

    var cardlist = [1];

    var boardlist = [0];

    var loggedinprofile;

    var refreshboardlist = true;

    var refreshcardlist = true;

    var origcardhtml =
    `<div class="card" style="max-width: 18rem;" id="gen-card-1">
        <div class="card-body">
        <h5 id='title' class="card-title">TEST TODO</h5>
    </div>
        <ul class="list-group list-group-flush">
            <li id="tag" class="list-group-item">TODO</li>
            <li id="desc" class="list-group-item">This is card that is showing how a TODO looks.</li>
        </ul>
    </div>
    <script>
        $('.card').draggable({
            revert: "invalid"
        });
    </script>`;

    var origboardtitle = 'Proj Manage';

    var origboarddesc = 'Drag and Drop Tiles (SCRUM Board)';

    var origboardid = 'gen-board';


    //Initiator
    if (isAuthenticated()) {
        getprofile();
        getboards();
        setcurrentboard();
        cardlist = [0];
    }


    //jQuery Listener type methods

    $('.card').draggable({
        revert: "invalid"
    });

    $('.col').droppable({
        accept: ".card",
        drop: function (event, ui) {
            $.when(rebuild($(this), ui)).done(changetag($(this), ui));
            ui.draggable.remove();
            $(".card").draggable({
                revert: "invalid"
            });

        }
    });

    var lock = new Auth0Lock(
        'IzzZjo5aDHBH0h1KLhsz4LeEaJ9b8WBz',
        'neighbors.auth0.com'
    );

    lock.on("authenticated", function (authResult) {
        // Use the token in authResult to getUserInfo() and save it to localStorage
        lock.getUserInfo(authResult.accessToken, function (error, profile) {
            if (error) {
                // Handle error
                console.log("something is wrong here: " + error)
                return;
            }

            loggedinprofile = profile;
            setprofilethings(loggedinprofile);
            getboards();

            var expiresAt = JSON.stringify(
                authResult.expiresIn * 1000 + new Date().getTime()
            );

            localStorage.setItem('accessToken', authResult.accessToken);
            localStorage.setItem('profile', JSON.stringify(profile));
            localStorage.setItem('expires_at', expiresAt);
        });
    });

    lock.on('authorization_error', (error) => console.log('Authentication Error', error));

    $('#login').click(function (event) {
        event.preventDefault();
        lock.show();
        cardlist = [0];
    })

    $('#logout').click(function () {
        logout();
        cardlist = [1];
        loggedinprofile = {};
    })

    $('#newboard').click(function (event) {
        event.preventDefault();
        buildboard();
    })


    $('#newtodo').click(function (event) {
        event.preventDefault();
        vex.dialog.open({
            message: 'Enter a Title and Description for new TODO',
            input: [
                '<style>',
                '.vex-custom-field-wrapper {',
                'margin: 1em 0;',
                '}',
                '.vex-custom-field-wrapper > label {',
                'display: inline-block;',
                'margin-bottom: .2em;',
                '}',
                '</style>',
                '<div class="vex-custom-field-wrapper">',
                '<label for="date">Title</label>',
                '<div class="vex-custom-input-wrapper">',
                '<input name="title" type="text" />',
                '</div>',
                '</div>',
                '<div class="vex-custom-field-wrapper">',
                '<label for="color">Description</label>',
                '<div class="vex-custom-input-wrapper">',
                '<textarea rows="4" cols="50" type="desc" name="desc" ></textarea></div></div>'
            ].join(''),
            callback: function (data) {
                if (!data) {
                    return console.log('Cancelled')
                }
                var cardid = setcardid();
                var cardhtml =
                    `<div class="card" style="max-width: 18rem;" id="${cardid}">
                        <!-- <img id='topimage' class="card-img-top" src="" alt="Card image cap"> -->
                        <div class="card-body">
                            <h5 id='title' class="card-title">${data.title}</h5>
                        </div>
                            <ul class="list-group list-group-flush">
                            <li id="tag" class="list-group-item">TODO</li>
                            <li id="desc" class="list-group-item">${data.desc}</li>
                        </ul>
                    </div>
                    <script>
                        $('.card').draggable({
                            revert: "invalid"
                        });
                    </script>`
                if ($("div[id*='board']").attr("id") == "gen-board") $("#to-do").append(cardhtml);
                else if (isAuthenticated() && $("div[id*='board']").attr('id') !== 'gen-board') create(cardendpoint, data.title, data.desc, cardid);
            }
        })
    })


    //Section for Helper Methods.

    //method that works with Boardlinks
    aclick = (event) => {
        loadboard(event.currentTarget.text, event.currentTarget.getAttribute('data-desc'), event.currentTarget.getAttribute('data-elemid'));
    }

    function create(endpoint, title, desc, elemid) {
        $.post(endpoint, JSON.stringify({title: title, desc: desc, elemid: elemid}))
         .done(function(data){
            console.log(data)
            if (elemid.split('-')[1] == 'board') {
                setboardlist(data.id, data.title, data.desc, data.elemid);
            } else if (elemid.split('-')[2] == 'card') {
                buildcard(data.id, data.title, data.desc, data.elemid);
            }
        }).fail(function(data){console.error(data)});
    }

    function buildcard(crdid, crdttl, crddesc, crdelemid){
        var cardhtml =
            `<div class="card" style="max-width: 18rem;" id="${crdelemid}" data-id="${crdid}">
                <!-- <img id='topimage' class="card-img-top" src="" alt="Card image cap"> -->
                <div class="card-body">
                    <h5 id='title' class="card-title">${crdttl}</h5>
                </div>
                    <ul class="list-group list-group-flush">
                    <li id="tag" class="list-group-item">TODO</li>
                    <li id="desc" class="list-group-item">${crddesc}</li>
                </ul>
            </div>
            <script>
                $('.card').draggable({
                    revert: "invalid"
                });
            </script>`
        $('#to-do').append(cardhtml);
    }

    function loadboard(ttl, dsc, bid){
        $(".card").remove();
        $('#board-title').text(ttl);
        $('#board-desc').text(dsc);
        $("div[id*='board']").attr('id', bid);
        cardlist = [0];
        refreshcardlist = true;
        localStorage.setItem('current_board', JSON.stringify({title: ttl, desc: dsc, boardid: bid}));
        getcards(bid);
    }

    function setcurrentboard(){
        var crntbrd = JSON.parse(localStorage.getItem('current_board'));
        if(crntbrd != null) loadboard(crntbrd.title, crntbrd.desc, crntbrd.boardid);
    }

    function getcards(brdid){
        $.get(cardendpoint, function (data) {
            for (i in data) {
                if (data[i].elemid.split('-')[1] == loggedinprofile.nickname && brdid.split('-')[0] == data[i].elemid.split('-')[0]) {
                    if (refreshcardlist) {
                        cardlist.push(Number(data[i].elemid.split('-')[3]));
                    }
                    var cardhtml = `<div class="card" style="max-width: 18rem;" id="${data[i].elemid}" data-id="${data[i].id}">
                        <!-- <img id='topimage' class="card-img-top" src="" alt="Card image cap"> -->
                            <div class="card-body">
                                <h5 id='title' class="card-title">${data[i].title}</h5>
                            </div>
                            <ul class="list-group list-group-flush">
                                <li id="tag" class="list-group-item">${data[i].tag}</li>
                                <li id="desc" class="list-group-item">${data[i].desc}</li>
                            </ul>
                        </div>
                        <script>
                            $('.card').draggable({
                                revert: "invalid"
                            });
                        </script>`;
                    if (data[i].tag == 'TODO')  $('#to-do').append(cardhtml);
                    else if (data[i].tag == 'In Progress') $('#in-progress').append(cardhtml);
                    else if (data[i].tag == 'Done') $('#done').append(cardhtml);
                }
            }
            refreshcardlist = false;
        })

    }


    function isAuthenticated() {
        // Check whether the current time is past the
        // Access Token's expiry time
        var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }

    function rebuild(th, inui) {
        var id = inui.draggable["0"].id;
        var dataid = inui.draggable["0"].getAttribute('data-id');
        th.append('<div class="card" style="max-width: 18rem;" id="' + id + '" data-id="'+ dataid +'" >' + inui.draggable.html() + '</div>');
    }

    function changetag(th, inui) {
        var id = inui.draggable["0"].id;
        var dropid = th.attr('id');
        setTimeout(function () {
            if (dropid == 'to-do') {
                $('#' + id).find('#tag').text('TODO');
                updatetag($("#" + id).attr('data-id'), 'TODO');
            }
            else if (dropid == 'in-progress') {
                $('#' + id).find('#tag').text('In Progress');
                updatetag($("#" + id).attr("data-id"), "In Progress");
            }
            else if (dropid == 'done') { 
                $('#' + id).find('#tag').text('Done');
                updatetag($("#" + id).attr("data-id"), "Done");
            }
        }, 1)
    }

    function updatetag(crdid, crtag){
        $.put(cardendpoint+'/'+crdid, JSON.stringify({tag: crtag}), function(result){
            console.log(result);
        })

    }

    function setcardid() {
        var boardid = $("div[id*='board']").attr('id');
        if (boardid == 'gen-board') {
            var maxcardid = Math.max(...cardlist);
            cardlist.push(maxcardid + 1);
            return 'gen-card-' + (maxcardid + 1);
        } else if (isAuthenticated()) {
            var splitboard = boardid.split('-')[0];
            var maxcardid = Math.max(...cardlist);
            cardlist.push(maxcardid + 1);
            return splitboard + '-' + loggedinprofile.nickname + '-card-' + (maxcardid + 1);
        }
    }

    function setboardid() {
        var maxboardid = Math.max(...boardlist);
        boardlist.push(maxboardid + 1);
        return (maxboardid + 1) + '-board-' + loggedinprofile.nickname;
    }

    function getprofile() {
        loggedinprofile = JSON.parse(localStorage.getItem('profile'));
        setprofilethings(loggedinprofile);
    }

    function setprofilethings(prof) {
        $('#login').hide();
        $('#profileimg').attr('src', prof.picture);
        $('#profilenick').text(prof.nickname);
        $('#loggedin').removeAttr('hidden');
        $('#boarddropdown').removeAttr('hidden');
    }


    function buildboard() {
        if (!isAuthenticated()) vex.dialog.alert('You need to login to create a new Board');
        else {
            vex.dialog.open({
                message: 'Enter a Title and Description for new Board',
                input: [
                    '<style>',
                    '.vex-custom-field-wrapper {',
                    'margin: 1em 0;',
                    '}',
                    '.vex-custom-field-wrapper > label {',
                    'display: inline-block;',
                    'margin-bottom: .2em;',
                    '}',
                    '</style>',
                    '<div class="vex-custom-field-wrapper">',
                    '<label for="date">Title</label>',
                    '<div class="vex-custom-input-wrapper">',
                    '<input name="title" type="text" />',
                    '</div>',
                    '</div>',
                    '<div class="vex-custom-field-wrapper">',
                    '<label for="color">Description</label>',
                    '<div class="vex-custom-input-wrapper">',
                    '<textarea rows="4" cols="50" type="desc" name="desc" ></textarea></div></div>'
                ].join(''),
                callback: function (data) {
                    var boardid = setboardid();
                    if (!data) {
                        return console.log('Cancelled')
                    }
                    $('#board-title').text(data.title);
                    $('#board-desc').text(data.desc);
                    $("div[id*='board']").attr('id', boardid);
                    $('.card').remove();
                    create(boardendpoint, data.title, data.desc, boardid);
                }
            })
        }
    }

    function getboards () {
      $.get(boardendpoint, function(data){
          var boardlistdropdown = `<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true"
                                    aria-expanded="false">
                                    Boards
                                   </a>
                                    <div id='boardloginlist' class="dropdown-menu" aria-labelledby="navbarDropdown" >`;
          for(i in data) {
              if(data[i].elemid.split('-')[2] == loggedinprofile.nickname) {
                  if (refreshboardlist) {
                    boardlist.push(Number(data[i].elemid.split('-')[0]));
                  }
                  boardlistdropdown += '<a id="boardlinks" class="dropdown-item" href="javascript:void(0);" onclick="aclick(event)" data-id="' + data[i].id + '" data-desc="' + data[i].desc + '" data-elemid="' + data[i].elemid + '">' + data[i].title + "</a>";
              };
          }
          boardlistdropdown += '</div>';
          $('#boarddropdown').html(boardlistdropdown);
          refreshboardlist = false;
      })  
    }

    function setboardlist(brdid, brdttl, brddesc, brdelemid) {
        var brddrphtml = $("#boarddropdown").html();
        brddrphtml = brddrphtml.substr(0, brddrphtml.length - 6);
        brddrphtml += '<a id="boardlinks" class="dropdown-item" href="javascript:void(0);" onclick="aclick(event)" data-id="' + brdid + '" data-desc="' + brddesc + '" data-elemid="' + brdelemid + '">' + brdttl + "</a></div>";
        $('#boarddropdown').html(brddrphtml);
    }



    function logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('profile');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('current_board');
        $('#loggedin').attr('hidden', 'hidden');
        $("#boarddropdown").attr("hidden", "hidden");
        $('#login').show();
        $('.card').remove();
        $('#board-title').text(origboardtitle);
        $('#board-desc').text(origboarddesc);
        $("div[id*='board']").attr('id', origboardid);
        $('#to-do').append(origcardhtml);
    }

    jQuery.each(["put", "delete"], function (i, method) {
        jQuery[method] = function (url, data, callback, type) {
            if (jQuery.isFunction(data)) {
                type = type || callback;
                callback = data;
                data = undefined;
            }

            return jQuery.ajax({
                url: url,
                type: method,
                dataType: type,
                data: data,
                success: callback
            });
        };
    });

})
