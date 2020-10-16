import os
import random
from locust import HttpUser, between, task, events
from locust.runners import MasterRunner


class Config:
    def __init__(self):
        fips = os.environ.get('FIPS', '24031,11001,36093,10005,05145,USDC1,USIL1')
        self.app_url = os.environ.get('APP_URL')
        self.api_url = os.environ.get('API_URL')
        self.data_version = os.environ.get('DATA_VERSION', '1')
        self.debug = os.environ.get('DEBUG') == 'true '
        self.threshold_avg = int(os.environ.get('THRESHOLD_AVG', '1000'))
        self.threshold_95 = int(os.environ.get('THRESHOLD_95', '3000'))
        self.threshold_fails = int(os.environ.get('THRESHOLD_FAILS', '1'))
        self.test_fips = [x for x in [x.strip() for x in fips.split(',')] if x]
        self.covid_data_url = f'{self.api_url}/covid/v{self.data_version}'

    def __str__(self):
        return f'{self.__dict__}'

config = Config()


@events.init.add_listener
def on_locust_init(environment, **kwargs):
    mode = 'master' if isinstance(environment.runner, MasterRunner) else 'worker/standalone'
    print(f'Locust tests settings: {config}, mode="{mode}"')


@events.quitting.add_listener
def _(environment, **kw):
    result = {
        'fails': environment.stats.total.fail_ratio * 100,
        'resp.time': {
            'avg': int(environment.stats.total.avg_response_time),
            '99.9%': int(environment.stats.total.get_response_time_percentile(0.999)),
            '99%': int(environment.stats.total.get_response_time_percentile(0.99)),
            '95%': int(environment.stats.total.get_response_time_percentile(0.95)),
            '90%': int(environment.stats.total.get_response_time_percentile(0.85))
        }
    }
    print(f'Test complete statistics: {result}')
    if environment.stats.total.fail_ratio * 100 > config.threshold_fails:
        print(f'❌ Test failed due to failure ratio > {config.threshold_fails}%')
        environment.process_exit_code = 1
    # elif environment.stats.total.avg_response_time > config.threshold_avg:
    #     print(f'❌ Test failed due to average response time ratio > {config.threshold_avg} ms')
    #     environment.process_exit_code = 1
    elif environment.stats.total.get_response_time_percentile(0.95) > config.threshold_95:
        print(f'❌ Test failed due to 95th percentile response time > {config.threshold_95} ms')
        environment.process_exit_code = 1
    else:
        print(f'✅ Test passed')
        environment.process_exit_code = 0


class WebsiteUser(HttpUser):
    wait_time = between(5, 15)
    
    def _validate_response(self, response, status_code, text=None):
        content = response.content or ''
        self.debug(f'Response [{response.status_code}]: {content[0:100]}')
        if response.status_code == status_code:
            if text or text in content:
                return True
            else:
                response.failure(f'Got wrong response content, doesn\'t contains \'{text}\'')
        else:
            response.failure(f'Got wrong response code {response.status_code} (expect: {status_code})')

    def debug(self, message):
        if config.debug:
            print(message)


    @task
    def app_home_page(self):
        with self.client.get(config.app_url, catch_response=True) as response:
            self._validate_response(response, 200, 'meta buildtime=')
            self._validate_response(response, 200, 'COVID-19 Tracker')
        
    @task
    def api_get_daily_us(self):
        with self.client.get(f'{config.covid_data_url}/daily/latest/us.json', catch_response=True) as response:
            self._validate_response(response, 200, '"United States"')
            self._validate_response(response, 200, '"country"')

    @task
    def api_get_daily_states(self):
        with self.client.get(f'{config.covid_data_url}/daily/latest/all-states.json', catch_response=True) as response:
            self._validate_response(response, 200, '"Maryland"')
            self._validate_response(response, 200, '"Alaska"')
            self._validate_response(response, 200, '"Washington"')
    
    @task
    def api_get_daily_states(self):
        with self.client.get(f'{config.covid_data_url}/daily/latest/us/all-counties.json', catch_response=True) as response:
            self._validate_response(response, 200, '"Arlington County, VA"')
            self._validate_response(response, 200, '"District of Columbia, DC"')
            self._validate_response(response, 200, '"Montgomery County, MD"')

    @task
    def api_get_daily_by_fips(self):
        fips = random.choice(config.test_fips)
        with self.client.get(f'{config.covid_data_url}/daily/latest/us/{fips[0:2]}/{fips}.json', catch_response=True) as response:
            self._validate_response(response, 200, f'"{fips}"')
            self._validate_response(response, 200, '"District of Columbia, DC"')
            self._validate_response(response, 200, '"US"')
            self._validate_response(response, 200, '"county"')
