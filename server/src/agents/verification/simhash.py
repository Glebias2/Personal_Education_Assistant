import re
import hashlib
from collections import Counter

HASH_BITS = 128


def create_simhash_vector(text:str) -> list[int]:
    words = re.findall(r'\w+', text.lower())
    weights = Counter(words)
    
    vector = [0] * HASH_BITS
    
    for word, weight in weights.items():
        word_hash = int(hashlib.md5(word.encode()).hexdigest(), 16)
        
        for i in range(HASH_BITS):
            bit_mask = 1 << i
            if word_hash & bit_mask:
                vector[i] += weight
            else:
                vector[i] -= weight

    return vector
