from logging import INFO, DEBUG, StreamHandler, getLogger

logger = getLogger()
logger.setLevel(INFO)

def main():
    print("python commend")
    #logger.debug('event: %s', event)
    logger.debug('log from the python')

    return "Ok"

if __name__ == '__main__':
    main()