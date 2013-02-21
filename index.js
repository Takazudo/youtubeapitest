(function() {
  // The client id is obtained from the Google APIs Console at https://code.google.com/apis/console
  // If you run access this code from a server other than http://localhost, you need to register
  // your own client id.
  var OAUTH2_CLIENT_ID = '317745668312.apps.googleusercontent.com';
  var OAUTH2_SCOPES = [
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];

  // Keeps track of the YouTube user id of the current authenticated user.
  var channelId;

  // This callback is invoked by the Google APIs JS client automatically when it is loaded.
  // See http://code.google.com/p/google-api-javascript-client/wiki/Authentication for docs.
  window.onJSClientLoad = function() {
    gapi.auth.init(function() {
      window.setTimeout(checkAuth, 1);
    });
  };

  // Attempt the immediate OAuth 2 client flow as soon as the page is loaded.
  // If the currently logged in Google Account has previously authorized OAUTH2_CLIENT_ID, then
  // it will succeed with no user intervention. Otherwise, it will fail and the user interface
  // to prompt for authorization needs to be displayed.
  function checkAuth() {
    gapi.auth.authorize({
      client_id: OAUTH2_CLIENT_ID,
      scope: OAUTH2_SCOPES,
      immediate: true
    }, handleAuthResult);
  }

  // Handles the result of a gapi.auth.authorize() call.
  function handleAuthResult(authResult) {
    if (authResult) {
      // Auth was successful; hide the things related to prompting for auth and show the things
      // that should be visible after auth succeeds.
      $('.pre-auth').hide();
      $('.post-auth').show();

      loadAPIClientInterfaces();
    } else {
      // Auth was unsuccessful; show the things related to prompting for auth and hide the things
      // that should be visible after auth succeeds.
      $('.post-auth').hide();
      $('.pre-auth').show();

      // Make the #login-link clickable, and attempt a non-immediate OAuth 2 client flow.
      // The current function will be called when that flow is complete.
      $('#login-link').click(function() {
        gapi.auth.authorize({
          client_id: OAUTH2_CLIENT_ID,
          scope: OAUTH2_SCOPES,
          immediate: false
        }, handleAuthResult);
      });
    }
  }

  // Loads the client interface for the YouTube Analytics and Data APIs.
  // This is required before using the Google APIs JS client; more info is available at
  // http://code.google.com/p/google-api-javascript-client/wiki/GettingStarted#Loading_the_Client
  function loadAPIClientInterfaces() {
    gapi.client.load('youtube', 'v3', function() {
      gapi.client.load('youtubeAnalytics', 'v1', function() {
        // Once both the client interfaces are loaded, use the Data API to request information
        // about the authenticated user's channel.
        getUserChannel();
      });
    });
  }

  // Calls the YouTube Data API to retrieve info about the YouTube  channel of the current
  // authenticated user.
  function getUserChannel() {
    // https://developers.google.com/youtube/v3/docs/channels/list
    var request = gapi.client.youtube.channels.list({
      // mine: true indicates that we want to retrieve the channel for the authenticated user.
      mine: true,
      part: 'id,contentDetails'
    });

    request.execute(function(response) {
      if ('error' in response) {
        displayMessage(response.error.message);
      } else {
        // We will need the user id associated with this channel later on when making calls to the
        // Analaytics API. It looks like UCdLFeWKpkLhkguiMZUp8lWA.
        channelId = response.items[0].id;
        // This is a string of the form UUdLFeWKpkLhkguiMZUp8lWA, and represents a unique
        // identifier for the uploads in the authenticated user's channel.
        var uploadsListId = response.items[0].contentDetails.relatedPlaylists.uploads;
        // Now that we have the uploads list id, retrieve the items in the uploads list.
        getUploadsList(uploadsListId);
      }
    });
  }

  // Calls the YouTube GData API to retrieve the most recent videos uploaded in the current
  // authenticated user's channel.
  function getUploadsList(listId) {
    // https://developers.google.com/youtube/v3/docs/playlistitems/list
    var request = gapi.client.youtube.playlistItems.list({
      playlistId: listId,
      part: 'snippet'
    });

    request.execute(function(response) {
      if ('error' in response) {
        displayMessage(response.error.message);
      } else {
        if ('items' in response) {
          // jQuery.map() iterates through all the items in the response and creates a new array
          // that contains only the specific property we're looking for: videoId.
          var videoIds = $.map(response.items, function(item) {
            return item.snippet.resourceId.videoId;
          });

          // Now that we know the ids of all the videos in the uploads list, we can retrieve info
          // about each video.
          getMetadataForVideos(videoIds);
        } else {
          displayMessage('There are no videos in your channel.');
        }
      }
    });
  }

  // Given an array of video ids, obtains metadata about each video and then uses that to display
  // a list to the user.
  function getMetadataForVideos(videoIds) {
    // https://developers.google.com/youtube/v3/docs/videos/list
    var request = gapi.client.youtube.videos.list({
      // 'id' takes a comma-separated string of video ids.
      id: videoIds.join(','),
      part: 'id,snippet,statistics'
    });

    request.execute(function(response) {
      if ('error' in response) {
        displayMessage(response.error.message);
      } else {
        // Get the jQuery wrapper for #video-list once outside the loop.
        var videoList = $('#video-list');
        $.each(response.items, function() {
          // Exclude videos that don't have any views, since there won't be any interesting
          // viewcount analytics data for them.
          if (this.statistics.viewCount == 0) {
            return;
          }

          var title = this.snippet.title;
          var videoId = this.id;

          // Dynamically create a new <li> element containing an <a> element.
          // Set the <a> element's text content to the video's title, and add a click handler that
          // will display Analytics data when invoked.
          var liElement = $('<li>');
          var aElement = $('<a>');
          // The dummy href value of '#' ensures the browser renders the <a> as a clickable link.
          aElement.attr('href', '#');
          aElement.text(title);
          aElement.click(function() {
            displayMessage('You clicked on video id ' + videoId);
          });

          // Call the jQuery.append() method to add the new <a> to the <li>,
          // and the <li> to the parent <ul>.
          liElement.append(aElement);
          videoList.append(liElement);
        });

        if (videoList.children().length == 0) {
          displayMessage('There are no videos in your channel that have been viewed.');
        }
      }
    });
  }

  // Helper method to display a message on the page.
  function displayMessage(message) {
    $('#message').text(message).show();
  }

  // Helper method to hide a previously displayed message on the page.
  function hideMessage() {
    $('#message').hide();
  }
})();
