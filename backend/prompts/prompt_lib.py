from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder


document_analysis_prompt = ChatPromptTemplate.from_template(
    """
    You are a highly capable assistant trained to analyze and summarize documents.
    Return ONLY valid JSON that matches EXACTLY the provided schema.

    Schema (example):
    {format_instructions}

    Analyze this document text:
    {document_text}
    """.strip()
)

document_comparison_prompt = ChatPromptTemplate.from_template(
    """
    You will be provided content from two PDFs. Your tasks:
    1) Compare the content in two PDFs
    2) Identify differences and note the page number
    3) Output must be a page-wise comparison
    4) If a page has no change, write "NO CHANGE"

    Input documents:
    {combined_docs}

    Return ONLY valid JSON following this schema:
    {format_instruction}
    """.strip()
)

contextualize_question_prompt = ChatPromptTemplate.from_messages([
    ("system",
     "Given a conversation history and the most recent user query, rewrite the query as a standalone question "
     "that makes sense without previous context. Do NOT answer—only rewrite if needed; otherwise return unchanged."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

context_qa_prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You answer strictly from the provided context. If the answer is not in context, reply with \"I don't know.\" "
     "Keep answers concise (≤3 sentences).\n\nContext:\n{context}"),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

# -----------------------------
# EI prompts (new)
# -----------------------------

# analyze_journal: returns strict JSON with emotions/sentiment/distortions/topics/facet_signals/one_line_insight
analyze_journal_prompt = ChatPromptTemplate.from_template(
    """
    You are an EQ analyst. Return STRICT JSON only (no prose, no markdown).
    JSON must contain these keys exactly:
    - emotions: list of objects {{ "label": string, "score": float }}
    - sentiment: float in [-1,1]
    - cognitive_distortions: list[string]
    - topics: list[string]
    - facet_signals: object with keys {{ "self_awareness","self_regulation","motivation","empathy","social_skills" }} and values "+", "-", or "0"
    - one_line_insight: string

    User entry:
    Text: {journal}
    Mood(1-5): {mood}
    Optional context (JSON): {context_json}
    """.strip()
)


recommend_exercise_prompt = ChatPromptTemplate.from_template(
    """
    You are an emotional intelligence coach. Given retrieved content chunks, select ONE short micro-exercise
    that fits the user's state. Prefer 2-3 minute exercises for high arousal (anger/anxiety).
    Return STRICT JSON with keys:
    - exercise_id (string)
    - title (string)
    - steps (list[string])
    - expected_outcome (string)
    - source_doc_id (string)
    - followup_question (string)

    User state:
    target_facets: {target_facets}
    context_tags: {context_tags}
    duration_hint: {duration_hint}

    Retrieved chunks (top-k):
    {chunks_block}
    """.strip()
)

coach_question_prompt = ChatPromptTemplate.from_template(
    """
    You are an empathetic coach using motivational interviewing.
    Ask exactly ONE brief, non-judgmental, reflective question that nudges self-awareness.
    Do NOT give advice. Do NOT ask multiple questions.

    State:
    facet: {facet}
    emotions: {emotions_json}
    last_entry_summary: {last_entry_summary}
    """.strip()
)

safety_check_prompt = ChatPromptTemplate.from_template(
    """
    You are a safety triage assistant. Classify the text for imminent risk or self-harm intent.
    Return STRICT JSON with a single key "label" whose value is either "SAFE" or "ESCALATE".

    Text:
    {text}
    """.strip()
)

# Team collaboration prompts
collab_rewrite_prompt = ChatPromptTemplate.from_template(
    """
    Rewrite this message to be assertive, kind, and specific. Remove blame language, 
    add curiosity, and make it constructive. Keep user intent. ≤120 words.
    Return only the rewrite.

    Original message: {text}
    Intent: {intent}
    """.strip()
)

collab_debrief_prompt = ChatPromptTemplate.from_template(
    """
    Summarize these meeting notes into strict JSON with exactly these keys:
    - tensions: list of tension/conflict points mentioned
    - feelings_needs: list of emotions or needs expressed  
    - agreements: list of decisions or consensus reached
    - next_steps: list of objects with keys: owner, due, task
    
    Return JSON only, no other text.

    Meeting notes:
    {notes}
    """.strip()
)

# Optional challenge generator prompt
challenge_generator_prompt = ChatPromptTemplate.from_template(
    """
    Generate a 7-day wellness challenge for the given target facets and team context.
    Return STRICT JSON with keys: title, daily_tasks (array of 7 strings), description.

    Target facets: {target_facets}
    Team context: {team_context}
    """.strip()
)


PROMPT_REGISTRY = {
    "document_analysis": document_analysis_prompt,
    "document_comparison": document_comparison_prompt,
    "contextualize_question": contextualize_question_prompt,
    "context_qa": context_qa_prompt,
    
    "analyze_journal": analyze_journal_prompt,
    "recommend_exercise": recommend_exercise_prompt,
    "coach_question": coach_question_prompt,
    "safety_check": safety_check_prompt,
    
    # New collaboration prompts
    "collab_rewrite": collab_rewrite_prompt,
    "collab_debrief": collab_debrief_prompt,
    "challenge_generator": challenge_generator_prompt,
}