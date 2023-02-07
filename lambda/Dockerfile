FROM amazon/aws-lambda-python:3.8

RUN pip3 install --upgrade pip
RUN python -m pip install joblib awsiotsdk

RUN pip install numpy pillow

WORKDIR /var/task/lambda

COPY lambda_function.py /var/task

COPY . .

CMD ["lambda_function.lambda_handler"]