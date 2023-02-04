FROM amazon/aws-lambda-python:3.8

RUN pip3 install --upgrade pip
RUN pip3 install scikit-build wheel 

RUN python -m pip install joblib pandas

#RUN pip install diffusers==0.10.2 transformers scipy ftfy accelerate
RUN pip install torch diffusers transformers accelerate

WORKDIR /var/task/stable-diffusion

COPY inference.py /var/task
COPY . .

CMD ["inference.handler"]