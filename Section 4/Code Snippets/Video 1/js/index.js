$(document).ready(function() {

    var cardlist = [1];

    var boardlist = [0];

    var loggedinprofile;

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

    if(isAuthenticated()) {
        getprofile();
        cardlist = [0];
    }

    $('.card').draggable({
        revert: "invalid"
    });

    $('.col').droppable({
        accept: ".card",
        drop: function (event, ui) {
            $.when( rebuild($(this), ui) ).done ( changetag($(this), ui) );
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

            var expiresAt = JSON.stringify(
                authResult.expiresIn * 1000 + new Date().getTime()
            );

            localStorage.setItem('accessToken', authResult.accessToken);
            localStorage.setItem('profile', JSON.stringify(profile));
            localStorage.setItem('expires_at', expiresAt);
        });
    });

    $('#login').click(function(){
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
    

    $('#newtodo').click(function(event){
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
                var cardhtml =
                    `<div class="card" style="max-width: 18rem;" id="${setcardid()}">
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
                $('#to-do').append(cardhtml);
            }
        })
    })

    function isAuthenticated() {
        // Check whether the current time is past the
        // Access Token's expiry time
        var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }

    function rebuild(th, inui) {
        var id = inui.draggable["0"].id;
        th.append('<div class="card" style="max-width: 18rem;" id="'+id+'">' + inui.draggable.html() + '</div>');
    }

    function changetag(th, inui) {
        var id = inui.draggable["0"].id;
        var dropid = th.attr('id');
        setTimeout(function () {
            if (dropid == 'to-do') $('#' + id).find('#tag').text('TODO');
            else if (dropid == 'in-progress') $('#' + id).find('#tag').text('In Progress');
            else if (dropid == 'done') $('#' + id).find('#tag').text('Done');
        }, 1)
    }

    function setcardid () {
        var boardid = $("div[id*='board']").attr('id');
        console.log(boardid);
        if( boardid == 'gen-board' ) {
            var maxcardid = Math.max(...cardlist);
            cardlist.push(maxcardid + 1);
            return 'gen-card-' + (maxcardid+1);
        } else if (isAuthenticated()) {
            var splitboard = boardid.split('-')[0];
            var maxcardid = Math.max(...cardlist);
            cardlist.push(maxcardid + 1);
            console.log('Max cardlist: '+maxcardid);
            console.log('Max cardlist + 1: '+(maxcardid + 1));
            return splitboard + '-' + loggedinprofile.nickname + '-card-' + (maxcardid + 1);
        }
    }

    function setboardid () {
        var maxboardid = Math.max(...boardlist);
        boardlist.push(maxboardid + 1);
        return (maxboardid + 1) + '-board-' + loggedinprofile.nickname;
    }

    function getprofile () {
        loggedinprofile = JSON.parse(localStorage.getItem('profile'));
        setprofilethings(loggedinprofile);
    }

    function setprofilethings (prof) {
        $('#login').hide();
        $('#profileimg').attr('src', prof.picture);
        $('#profilenick').text(prof.nickname);
        $('#loggedin').removeAttr('hidden');
    }


    function buildboard () {
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
                    if (!data) {
                        return console.log('Cancelled')
                    }
                    $('#board-title').text(data.title);
                    $('#board-desc').text(data.desc);
                    $("div[id*='board']").attr('id', setboardid());
                    console.log($("div[id*='board']").attr('id'));
                    $('.card').remove();
                }
            })
        }
    }

    function logout () {
        console.log('logout called');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('profile');
        localStorage.removeItem('expires_at');
        $('#loggedin').attr('hidden', 'hidden');
        $('#login').show();
        $('.card').remove();
        $('#board-title').text(origboardtitle);
        $('#board-desc').text(origboarddesc);
        $("div[id*='board']").attr('id', origboardid);
        $('#to-do').append(origcardhtml);
    }

})
