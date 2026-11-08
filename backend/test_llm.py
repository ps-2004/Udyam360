import asyncio
from llm_advisor import call_llm

async def main():
    messages = [
        {
            "role": "system",
            "content": "You are a helpful MSME business advisor. Reply in Hindi."
        },
        {
            "role": "user",
            "content": "Mera chhota clinic hai, 8 log hain aur budget 4000 hai. Kya recommend karoge?"
        }
    ]

    response = await call_llm(messages)
    print("\nAI RESPONSE:\n", response)

if __name__ == "__main__":
    asyncio.run(main())