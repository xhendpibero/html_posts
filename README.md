# JSONPlaceholder Viewer

A lightweight web application that interacts with the JSONPlaceholder API to display posts and reports.

## Features

- View and search posts from JSONPlaceholder
- Highlight posts containing "rerum" in the body
- View comments for each post
- View reports on post statistics
- Clean, responsive design
- Secure from common web vulnerabilities
- Thoroughly tested

## Pages

1. **Posts Page (index.html)**
   - Search functionality
   - Paginated results
   - Highlighting of "rerum" in post bodies
   - Comment viewing functionality

2. **Reports Page (reports.html)**
   - Count of posts containing "rerum"
   - Count of posts per user

## Implementation Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Bootstrap 5 for styling
- Modular code structure
- Security-focused implementation
- Optimized for performance
- Responsive design that works on all devices

## Security Measures

- HTTPS API connection
- Content Security Policy
- Input validation
- XSS protection via content sanitization
- CSRF protection

## Testing

Run tests by appending `?test=true` to any page URL, e.g.:
```
http://localhost:8080/index.html?test=true
```

## Local Development

1. Clone the repository
2. Open any HTML file in a browser or use a local server:

```bash
# Using Node.js http-server
npx http-server -p 8080
```

## Code Structure

- `/css` - Stylesheet
- `/js` - JavaScript modules
  - `api.js` - API handling
  - `ui.js` - UI utilities
  - `posts.js` - Posts page logic
  - `reports.js` - Reports page logic
  - `tests.js` - Test suite
- `index.html` - Posts page
- `reports.html` - Reports page
```
