import time
import requests
import concurrent.futures
import statistics
import sys

API_URL = "http://localhost:8000/api/simulate"

# Sample payload for a heavy Monte Carlo simulation
PAYLOAD = {
    "product": {
        "archetype": "EQUITY_ACCUMULATOR",
        "denomination_currency": "USD",
        "notional_amount": 1000000,
        "underlyings": [{"symbol": "AAPL", "name": "Apple", "initial_fixing": 150}],
        "accumulator_parameters": {
            "strike_price": 140,
            "knock_out_barrier_pct": 105,
            "daily_share_count": 100,
            "gearing_ratio": 2.0,
            "total_observation_days": 252,
            "guaranteed_days": 0
        }
    },
    "assumptions": {
        "volatility": 0.25,
        "drift": 0.05,
        "dividend_yield": 0.0,
        "path_count": 10000,
        "seed": 42,
        "method": "simulated"
    }
}

def simulate_request():
    start_time = time.time()
    try:
        response = requests.post(API_URL, json=PAYLOAD, timeout=10)
        duration = time.time() - start_time
        return {"status": response.status_code, "duration": duration}
    except Exception as e:
        return {"status": "error", "duration": time.time() - start_time, "error": str(e)}

def run_load_test(concurrency=10, total_requests=50):
    print(f"Starting load test: {concurrency} concurrent workers, {total_requests} total requests...")
    results = []
    start_time = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(simulate_request) for _ in range(total_requests)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    total_time = time.time() - start_time
    durations = [r["duration"] for r in results if r["status"] == 200]
    errors = [r for r in results if r["status"] != 200]

    print("\n--- Load Test Results ---")
    print(f"Total Time: {total_time:.2f}s")
    print(f"Successful Requests: {len(durations)}/{total_requests}")
    print(f"Failed Requests: {len(errors)}")

    if durations:
        avg_time = statistics.mean(durations)
        p95_time = np.percentile(durations, 95) if 'np' in sys.modules else sorted(durations)[int(len(durations)*0.95)]
        
        print(f"Average Latency: {avg_time:.3f}s")
        print(f"95th Percentile Latency: {p95_time:.3f}s")
        
        if p95_time > 5.0:
            print("❌ FAILED: 95th percentile latency exceeded 5.0 seconds.")
            sys.exit(1)
        else:
            print("✅ PASSED: 95th percentile latency is under 5.0 seconds.")
            sys.exit(0)
    else:
        print("❌ FAILED: No successful requests.")
        sys.exit(1)

if __name__ == "__main__":
    run_load_test(concurrency=5, total_requests=20)
