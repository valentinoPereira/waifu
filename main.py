import json
import os
from dotenv import load_dotenv
from generate_images_openrouter import OpenRouterImageGenerator

# Load environment variables from .env file
load_dotenv()

# Load API key from environment variable
api_key = os.getenv('OPENROUTER_API_KEY')
if not api_key:
    raise ValueError("OPENROUTER_API_KEY environment variable not set. Please create a .env file with your API key.")

with open('prompts.json', 'r') as f:
    prompt_data = json.load(f)
    prompts = prompt_data['prompts']

generator = OpenRouterImageGenerator(api_key, images_dir="public/images")

print("\n" + "=" * 60)
if generator.completed_prompt_indices:
    print(f"🔄 RESUMING: {len(generator.completed_prompt_indices)} prompts already completed")
    print(f"   Remaining to process: {len(prompts) - len(generator.completed_prompt_indices)}")
else:
    print(f"🚀 Starting fresh batch generation")
    print(f"   Total prompts to process: {len(prompts)}")
print("=" * 60 + "\n")

results = generator.batch_generate(prompts)
