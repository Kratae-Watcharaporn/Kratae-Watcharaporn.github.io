const selLineDropdown = document.getElementById('selLine');
const selUserDropdown = document.getElementById('selUser'); // Assuming you also have a selUser dropdown

// Fetch currentPageNames from the server (replace with your actual fetch code)
async function fetchCurrentPageNames() {
    try {
<<<<<<< HEAD
        const response = await fetch('https://k0c9lchx-3000.asse.devtunnels.ms/pages'); // Update URL
=======
        const response = await fetch('http://192.168.1.166:3000/pages'); // Update URL
>>>>>>> parent of be42a6c (no message)
        const currentPageNames = await response.json();
        return currentPageNames;
    } catch (error) {
        console.error('Error fetching currentPageNames:', error);
        return [];
    }
}

// Populate the dropdown options based on the fetched currentPageNames
async function populateDropdownOptions() {
    const currentPageNames = await fetchCurrentPageNames();

    // Clear any existing options
    selLineDropdown.innerHTML = '';

    // Add the initial placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '0';
    placeholderOption.textContent = '-Select Line-';
    selLineDropdown.appendChild(placeholderOption);

    // Mapping of page names to user-friendly names
    const displayNameMap = {
        'Page_1.html': 'left_to_right',
        'Page_2.html': 'right_to_left',
        'Page_3.html': 'top_to_bottom',
        'Page_4.html': 'bottom_to_top',
        'Page_5.html': 'lefttop_to_bottomright',
        'Page_6.html': 'rightbottom_to_lefttop',
        'Page_7.html': 'curve'
    };

    // Add the fetched currentPageNames as options
    currentPageNames.forEach((currentPageName) => {
        const option = document.createElement('option');
        option.value = currentPageName; // Use the actual page name
        option.textContent = displayNameMap[currentPageName];
        selLineDropdown.appendChild(option);
    });
}

// Event listener for when the user selects a page
selLineDropdown.addEventListener('change', () => {
    const selectedPageName = selLineDropdown.value;
    const selectedUser = selUserDropdown.value; // Get the selected user from selUser dropdown

    // Construct the URL with selected user and page name
    const newURL = `user.html?user=${encodeURIComponent(selectedUser)}&page=${encodeURIComponent(selectedPageName)}`;

    // Update the URL
    window.location.href = newURL;
});

// Call the function to populate dropdown options when the page loads
populateDropdownOptions();
