$(document).ready(function () {
  // Initialize select2 for user dropdown
  $("#selUser").select2({});

  // Retrieve previously selected user from localStorage if available
  var storedUser = localStorage.getItem('selectedUser');
  if (storedUser) {
    $('#selUser').val(storedUser).trigger('change');
  }

  // Get the user query parameter from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedUser = urlParams.get('user');

  // Set the selected user from the URL to userDisplayDiv
  var userDisplayDiv = $('#userDisplay');
  if (selectedUser) {
    userDisplayDiv.text(selectedUser);
  } else {
    userDisplayDiv.text('-Select User-');
  }

  // Event listener for user dropdown change
  $('#selUser').on('change', function () {
    var selectedUser = $(this).val();

    if (selectedUser !== '0') {
      userDisplayDiv.text(selectedUser);
      // Store the selected user in localStorage
      localStorage.setItem('selectedUser', selectedUser);
    } else {
      userDisplayDiv.text('-Select User-');
    }
  });

  // Initialize select2 for line dropdown
  $("#selLine").select2({});

  // Define the mapping of page names to display names
  const displayNameMap = {
    'Page_1.html': 'left_to_right',
    'Page_2.html': 'right_to_left',
    'Page_3.html': 'top_to_bottom',
    'Page_4.html': 'bottom_to_top',
    'Page_5.html': 'lefttop_to_bottomright',
    'Page_6.html': 'rightbottom_to_lefttop',
    'Page_7.html': 'curve'
  };

  // Handle button click to update URL
  $('#but_read').click(function () {
    var selectedUser = $('#selUser').val();
    var selectedLine = $('#selLine').val();

    if (selectedUser !== '0') {
      const newURL = `user.html?user=${encodeURIComponent(selectedUser)}`;
      // Redirect to the new URL
      window.location.href = newURL;
    }
  });

  $('#but_line').click(function () {
    var selectedLine = $('#selLine').val();
  
    if (selectedLine !== '0') {
      // Get the selected page name
      const selectedPageName = $('#selLine option:selected').text();
      
      // Redirect to user-specific page with selected user and page name as query parameters
      window.location.href = `user.html?user=${encodeURIComponent(selectedUser)}&page=${encodeURIComponent(selectedPageName)}`;
    }
  });
});
