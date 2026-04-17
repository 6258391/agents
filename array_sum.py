def array_sum(numbers):
    """Tính tổng các số trong mảng."""
    return sum(numbers)


if __name__ == "__main__":
    examples = [
        [1, 2, 3, 4, 5],
        [10, -3, 7],
        [],
        [100],
    ]

    for arr in examples:
        print(f"array_sum({arr}) = {array_sum(arr)}")
