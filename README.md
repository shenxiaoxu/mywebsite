# Mike Xiaoxu Shen - Personal Website

A personal website featuring articles, research, projects, and an AI chat interface powered by ChatGPT.

## Features

- **Personal Blog**: Articles about AI, infrastructure, and startups
- **Research Section**: Showcase of current research projects
- **Projects**: Open source contributions and personal projects
- **Media**: YouTube channel and other media content
- **AI Chat Interface**: Interactive chat powered by ChatGPT API

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mikexiaoxushen_site
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
```

4. Replace `your_openai_api_key_here` with your actual OpenAI API key.

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
   - Main site: http://localhost:3000
   - Chat interface: http://localhost:3000/chat

### Production Deployment

1. Build and start the production server:
```bash
npm start
```

2. The application will be available on the port specified in your `.env` file (default: 3000).

## File Structure

```
mikexiaoxushen_site/
├── index.html          # Main homepage
├── chat.html           # Chat interface
├── style.css           # Main styles
├── chat.css            # Chat-specific styles
├── chat.js             # Chat functionality
├── server.js           # Express server
├── package.json        # Dependencies
├── .env               # Environment variables (create this)
├── articles/          # Blog articles
├── research/          # Research projects
├── projects/          # Personal projects
└── images/            # Images and assets
```

## API Endpoints

- `POST /api/chat` - ChatGPT API endpoint
  - Body: `{ messages: [], model: "gpt-3.5-turbo", max_tokens: 1000, temperature: 0.7 }`

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details.
