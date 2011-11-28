





..
    Classes and methods

Class ViewContext
================================================================================

..
   class-title


The view context attached to this controller








    


Constructor
-----------

.. js:class:: ViewContext(component)



    
    :param  component: 
         
    







Methods
-------

..
   class-methods


getRoot
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#getRoot(dom)


    
    :param Boolean dom: 
        True to return the DOM element 
    



    
    :returns HtmlElement:
        The component's container element 
    


Returns the DOM container element for the component associated with this
view context.









    



getWebSocket
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#getWebSocket(url)


    
    :param  url: 
         
    




Method used to obtain a web socket for which a handler was defined into this
component.









    



publish
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#publish(eventName, data)


    
    :param  eventName: 
         
    
    :param  data: 
         
    




This is the method that will publish an event
and will execute all registered callbacks.









    



subscribe
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#subscribe(eventName, callback)


    
    :param  eventName: 
        Event name we want to subscribe to. Can be any string value. 
    
    :param  callback: 
        This is the callback method that will get executed. It must have
                    a single parameter called data.
            Ex: function(data) 
    




This is the method that allows registration of a callback method to a
desired event.









    



unsubscribe
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

.. js:function:: ViewContext#unsubscribe(eventName, callback)


    
    :param  eventName: 
        Event name we want to subscribe to. Can be any string value. 
    
    :param  callback: 
        This is the callback method that will get executed. It must have
                    a single parameter called data.
            Ex: function(data) 
    




Unsubscribe from an event









    




    



