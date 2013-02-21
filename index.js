(function() {
  // The client id is obtained from the Google APIs Console at https://code.google.com/apis/console
  // If you run access this code from a server other than http://localhost, you need to register
  // your own client id.
  var OAUTH2_CLIENT_ID = '317745668312.apps.googleusercontent.com';
  var OAUTH2_SCOPES = [
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];

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

      displayMessage("Authenticated.");
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

  // Helper method to display a message on the page.
  function displayMessage(message) {
    $('#message').text(message).show();
  }

  // Helper method to hide a previously displayed message on the page.
  function hideMessage() {
    $('#message').hide();
  }
})();
