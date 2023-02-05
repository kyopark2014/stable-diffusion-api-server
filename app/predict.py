from logging import INFO, DEBUG, StreamHandler, getLogger
import sys
import json

logger = getLogger()
logger.setLevel(INFO)

def main():
    logger.debug('log from the python')

    print('args:'+json.dumps(sys.argv[1]))
    logger.debug('args:'+json.dumps(sys.argv[1]));		

    #result = json.loads(sys.argv[1])['result']
    #inputData = json.loads(sys.argv[2])['inputData']
    #print(json.dumps(result))

    return "Ok"

if __name__ == '__main__':
    main()