# import weaviate
# import functools


# def wvt_client(func):
#     @functools.wraps(func)
#     def wrapper(*args, **kwargs):
#         # client = weaviate.connect_to_local(host="weaviate")
#         client = weaviate.connect_to_local()
#         try:
#             return func(client=client, *args, **kwargs)
#         finally:
#             client.close()

#     return wrapper

import weaviate
import functools


def wvt_client(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        client = weaviate.connect_to_local(host="weaviate", port=8080, grpc_port=50051)
        try:
            return func(client=client, *args, **kwargs)
        finally:
            client.close()

    return wrapper