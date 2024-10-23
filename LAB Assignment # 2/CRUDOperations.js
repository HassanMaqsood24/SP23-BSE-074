$(document).ready(function () {
  $(document).on("click", ".btn-del", deleteStory);
  $(document).on("click", ".btn-edit", editStory); // Fixed selector
  GetStoriesList();
  $("#create-button").on("click", handleFormSubmission);
});

// Function to get stories from the API
function GetStoriesList() {
  $.ajax({
      url: "https://usmanlive.com/wp-json/api/stories",
      method: "GET",
      dataType: "JSON",
      success: displayStories,
      error: function (error) {
          console.log("Get stories failed", error);
      }
  });
}

// Function to display story cards
function displayStories(data) {
  const StoryCardsContainer = $("#Story-cards");
  StoryCardsContainer.empty(); // Clear previous cards

  $.each(data, function (index, story) {
      const cardHtml = `
      <div class="card m-2" style="width: 18rem; height: 300px;">
          <div class="card-body text-center">
              <h3 class="Story-ID">${story.id}</h3> 
              <h5>${story.title}</h5>
              <p class="card-text">${story.content}</p>
              <div class="container">
                  <button type="button" class="btn btn-info btn-sm btn-edit" data-id="${story.id}" data-title="${story.title}" data-content="${story.content}">Edit</button>
                  <button type="button" class="btn btn-danger btn-sm btn-del" data-id="${story.id}">Delete</button>
              </div>
          </div>
      </div>
      `;
      StoryCardsContainer.append(cardHtml);
  });
}

// Delete story function
function deleteStory() {
  let StoryID = $(this).attr("data-id");
  console.log("Deleting story with ID:", StoryID);
  $.ajax({
      url: "https://usmanlive.com/wp-json/api/stories/" + StoryID,
      method: "DELETE",
      dataType: "JSON",
      success: function () {
          console.log("Story deleted successfully");
          GetStoriesList();
      },
      error: function (error) {
          console.error("Error deleting story", error);
      }
  });
}

// Handle form submission
function handleFormSubmission(event) {
  event.preventDefault();
  let storyId = $("#create-button").attr("data-id"); // Check if it's an update or a new story
  var title = $("#story-title").val();
  var content = $("#story-content").val();

  if (storyId) {
      updateStory(storyId, title, content); // Update the story if storyId exists
  } else {
      postStory(title, content); // Create a new story
  }
}

// Update story function
function updateStory(storyId, title, content) {
  $.ajax({
      url: "https://usmanlive.com/wp-json/api/stories/" + storyId,
      method: "PUT", // Use PUT to update an existing story
      data: { title, content },
      success: function () {
          console.log("Story updated successfully");
          GetStoriesList();
          resetForm(); // Reset form after update
      },
      error: function (error) {
          console.log("Error updating story", error);
      }
  });
}

// Post a new story
function postStory(title, content) {
  $.ajax({
      url: "https://usmanlive.com/wp-json/api/stories",
      method: "POST",
      data: { title, content },
      success: function () {
          console.log("Story posted successfully");
          GetStoriesList(); // Refresh stories list
          resetForm(); // Reset the form after posting
      },
      error: function (error) {
          console.log("Error posting story", error);
      }
  });
}

// Edit story - populate the form for editing
function editStory() {
  let storyId = $(this).attr("data-id");
  let title = $(this).attr("data-title");
  let content = $(this).attr("data-content");

  $("#story-title").val(title);
  $("#story-content").val(content);
  $("#create-button").text("Update").attr("data-id", storyId); 
}

// Reset form function
function resetForm() {
  $("#story-title").val("");
  $("#story-content").val("");
  $("#create-button").text("Create").removeAttr("data-id"); 
}
